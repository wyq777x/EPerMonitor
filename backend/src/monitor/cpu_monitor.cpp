#include "monitor/cpu_monitor.h"
#include <chrono>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <sstream>
#include <thread>
#include <vector>

#ifdef __linux__
#include <unistd.h>
#endif

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <winreg.h>
#elif defined(__APPLE__)
#include <mach/mach.h>
#include <mach/mach_host.h>
#include <mach/processor_info.h>
#include <sys/sysctl.h>
#include <unistd.h>
#endif

namespace epm
{

CPUInfo CPUMonitor::getCPUInfo()
{
    CPUInfo info;
    info.usage = calculateCPUUsage();
    info.cores = getCPUCores();
    info.modelName = getCPUModel();
    info.speed = getCPUSpeed();
    info.temperature = getCPUTemperature();
    return info;
}

double CPUMonitor::calculateCPUUsage()
{
#if defined(__linux__)
    static unsigned long long prevIdle = 0;
    static unsigned long long prevTotal = 0;

    std::ifstream file("/proc/stat");
    if (!file.is_open())
        return 0.0;

    std::string line;
    std::getline(file, line);

    std::istringstream iss(line);
    std::string cpu;
    unsigned long long user, nice, system, idle, iowait, irq, softirq, steal;

    iss >> cpu >> user >> nice >> system >> idle >> iowait >> irq >> softirq >> steal;

    unsigned long long idleTime = idle + iowait;
    unsigned long long totalTime = user + nice + system + idle + iowait + irq + softirq + steal;

    unsigned long long diffIdle = idleTime - prevIdle;
    unsigned long long diffTotal = totalTime - prevTotal;

    prevIdle = idleTime;
    prevTotal = totalTime;

    if (diffTotal == 0)
        return 0.0;

    double usage = 100.0 * (1.0 - static_cast<double>(diffIdle) / diffTotal);
    return usage < 0 ? 0.0 : (usage > 100 ? 100.0 : usage);
#elif defined(_WIN32)
    static bool initialized = false;
    static unsigned long long prevIdle = 0;
    static unsigned long long prevKernel = 0;
    static unsigned long long prevUser = 0;

    FILETIME idleTime, kernelTime, userTime;
    if (!GetSystemTimes(&idleTime, &kernelTime, &userTime))
        return 0.0;

    ULARGE_INTEGER idle;
    idle.LowPart = idleTime.dwLowDateTime;
    idle.HighPart = idleTime.dwHighDateTime;

    ULARGE_INTEGER kernel;
    kernel.LowPart = kernelTime.dwLowDateTime;
    kernel.HighPart = kernelTime.dwHighDateTime;

    ULARGE_INTEGER user;
    user.LowPart = userTime.dwLowDateTime;
    user.HighPart = userTime.dwHighDateTime;

    if (!initialized)
    {
        prevIdle = idle.QuadPart;
        prevKernel = kernel.QuadPart;
        prevUser = user.QuadPart;
        initialized = true;
        return 0.0;
    }

    unsigned long long idleDiff = idle.QuadPart - prevIdle;
    unsigned long long kernelDiff = kernel.QuadPart - prevKernel;
    unsigned long long userDiff = user.QuadPart - prevUser;

    prevIdle = idle.QuadPart;
    prevKernel = kernel.QuadPart;
    prevUser = user.QuadPart;

    unsigned long long total = kernelDiff + userDiff;
    if (total == 0)
        return 0.0;

    long long busy = static_cast<long long>(total) - static_cast<long long>(idleDiff);
    if (busy < 0)
        busy = 0;

    double usage = (static_cast<double>(busy) / total) * 100.0;
    return usage < 0 ? 0.0 : (usage > 100 ? 100.0 : usage);
#elif defined(__APPLE__)
    static std::vector<uint64_t> prevIdle;
    static std::vector<uint64_t> prevTotal;

    natural_t processorCount = 0;
    processor_info_array_t cpuInfo = nullptr;
    mach_msg_type_number_t numCpuInfo = 0;

    kern_return_t kr =
        host_processor_info(mach_host_self(), PROCESSOR_CPU_LOAD_INFO, &processorCount, &cpuInfo, &numCpuInfo);
    if (kr != KERN_SUCCESS || cpuInfo == nullptr)
        return 0.0;

    auto cpuLoadInfo = reinterpret_cast<processor_cpu_load_info_t>(cpuInfo);

    if (prevIdle.size() != processorCount)
    {
        prevIdle.assign(processorCount, 0);
        prevTotal.assign(processorCount, 0);
    }

    double totalUsage = 0.0;

    for (natural_t i = 0; i < processorCount; ++i)
    {
        const uint64_t user = cpuLoadInfo[i].cpu_ticks[CPU_STATE_USER];
        const uint64_t nice = cpuLoadInfo[i].cpu_ticks[CPU_STATE_NICE];
        const uint64_t system = cpuLoadInfo[i].cpu_ticks[CPU_STATE_SYSTEM];
        const uint64_t idle = cpuLoadInfo[i].cpu_ticks[CPU_STATE_IDLE];

        const uint64_t totalTicks = user + nice + system + idle;
        const uint64_t totalDiff = totalTicks - prevTotal[i];
        const uint64_t idleDiff = idle - prevIdle[i];

        prevTotal[i] = totalTicks;
        prevIdle[i] = idle;

        if (totalDiff > 0)
        {
            double coreUsage = (static_cast<double>(totalDiff - idleDiff) / totalDiff) * 100.0;
            if (coreUsage < 0)
                coreUsage = 0.0;
            if (coreUsage > 100.0)
                coreUsage = 100.0;
            totalUsage += coreUsage;
        }
    }

    vm_deallocate(mach_task_self(), reinterpret_cast<vm_address_t>(cpuInfo), numCpuInfo * sizeof(integer_t));

    if (processorCount == 0)
        return 0.0;

    return totalUsage / processorCount;
#else
    return 0.0;
#endif
}

double CPUMonitor::getCPUTemperature()
{
#if defined(__linux__)
    std::ifstream tempFile("/sys/class/thermal/thermal_zone0/temp");
    if (tempFile.is_open())
    {
        int temp;
        tempFile >> temp;
        return temp / 1000.0;
    }
#elif defined(_WIN32)
    return 0.0;
#elif defined(__APPLE__)
    return 0.0;
#endif
    return 0.0;
}

std::string CPUMonitor::getCPUModel()
{
#if defined(__linux__)
    std::ifstream cpuinfo("/proc/cpuinfo");
    if (!cpuinfo.is_open())
        return "Unknown";

    std::string line;
    while (std::getline(cpuinfo, line))
    {
        if (line.find("model name") != std::string::npos)
        {
            size_t pos = line.find(":");
            if (pos != std::string::npos)
            {
                std::string model = line.substr(pos + 2);
                return model;
            }
        }
    }
#elif defined(_WIN32)
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", 0, KEY_READ, &hKey) ==
        ERROR_SUCCESS)
    {
        char buffer[256];
        DWORD bufferSize = sizeof(buffer);
        if (RegGetValueA(hKey, nullptr, "ProcessorNameString", RRF_RT_REG_SZ, nullptr, buffer, &bufferSize) ==
            ERROR_SUCCESS)
        {
            RegCloseKey(hKey);
            return std::string(buffer);
        }
        RegCloseKey(hKey);
    }
#elif defined(__APPLE__)
    char model[256];
    size_t size = sizeof(model);
    if (sysctlbyname("machdep.cpu.brand_string", &model, &size, nullptr, 0) == 0)
    {
        return std::string(model);
    }
#endif
    return "Unknown";
}

int CPUMonitor::getCPUCores()
{
#if defined(__linux__)
    return static_cast<int>(sysconf(_SC_NPROCESSORS_ONLN));
#else
    return std::thread::hardware_concurrency();
#endif
}

int CPUMonitor::getCPUSpeed()
{
#if defined(__linux__)
    std::ifstream cpuinfo("/proc/cpuinfo");
    if (!cpuinfo.is_open())
        return 0;

    std::string line;
    while (std::getline(cpuinfo, line))
    {
        if (line.find("cpu MHz") != std::string::npos)
        {
            size_t pos = line.find(":");
            if (pos != std::string::npos)
            {
                std::string speed = line.substr(pos + 2);
                return static_cast<int>(std::stod(speed));
            }
        }
    }
#elif defined(_WIN32)
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", 0, KEY_READ, &hKey) ==
        ERROR_SUCCESS)
    {
        DWORD mhz = 0;
        DWORD size = sizeof(mhz);
        if (RegGetValueA(hKey, nullptr, "~MHz", RRF_RT_DWORD, nullptr, &mhz, &size) == ERROR_SUCCESS)
        {
            RegCloseKey(hKey);
            return static_cast<int>(mhz);
        }
        RegCloseKey(hKey);
    }
#elif defined(__APPLE__)
    uint64_t hz = 0;
    size_t size = sizeof(hz);
    if (sysctlbyname("hw.cpufrequency", &hz, &size, nullptr, 0) == 0 && hz > 0)
    {
        return static_cast<int>(hz / 1000000); // Convert to MHz
    }
#endif
    return 0;
}

} // namespace epm
