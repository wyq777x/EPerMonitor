#include "controllers/monitor_controller.h"
#include "monitor/cpu_monitor.h"
#include "monitor/disk_monitor.h"
#include "monitor/memory_monitor.h"
#include "monitor/network_monitor.h"
#include <ctime>
#include <fstream>
#include <sstream>
#ifdef _WIN32
#include <process.h>
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#else
#include <unistd.h>
#endif

#ifdef __APPLE__
#include <sys/sysctl.h>
#include <sys/time.h>
#include <sys/utsname.h>
#endif

namespace epm
{

Napi::Object MonitorController::GetSystemInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    SystemInfo sysInfo;

#if defined(__linux__)
    sysInfo.platform = "linux";

    {
        std::array<char, 256> buffer;
        if (gethostname(buffer.data(), buffer.size()) == 0)
        {
            sysInfo.hostname = std::string(buffer.data());
        }
        else
        {
            sysInfo.hostname = "unknown";
        }
    }

#if defined(__x86_64__) || defined(_M_X64)
    sysInfo.arch = "x64";
#elif defined(__i386) || defined(_M_IX86)
    sysInfo.arch = "x86";
#elif defined(__aarch64__) || defined(_M_ARM64)
    sysInfo.arch = "arm64";
#else
    sysInfo.arch = "unknown";
#endif

    CPUInfo cpu = CPUMonitor::getCPUInfo();
    sysInfo.cpuModel = cpu.modelName;
    sysInfo.cpuCores = cpu.cores;

    MemoryInfo mem = MemoryMonitor::getMemoryInfo();
    sysInfo.totalMemory = mem.total;

    std::ifstream uptime("/proc/uptime");
    if (uptime.is_open())
    {
        double seconds;
        uptime >> seconds;
        sysInfo.uptime = static_cast<unsigned long long>(seconds);
    }
    else
    {
        sysInfo.uptime = 0;
    }
#elif defined(_WIN32)
    sysInfo.platform = "windows";

    {
        std::array<char, MAX_COMPUTERNAME_LENGTH + 1> buffer;
        DWORD size = static_cast<DWORD>(buffer.size());
        if (GetComputerNameA(buffer.data(), &size))
        {
            sysInfo.hostname = std::string(buffer.data());
        }
        else
        {
            sysInfo.hostname = "unknown";
        }
    }

    SYSTEM_INFO systemInfo;
    GetNativeSystemInfo(&systemInfo);
    switch (systemInfo.wProcessorArchitecture)
    {
    case PROCESSOR_ARCHITECTURE_AMD64:
        sysInfo.arch = "x64";
        break;
    case PROCESSOR_ARCHITECTURE_INTEL:
        sysInfo.arch = "x86";
        break;
    case PROCESSOR_ARCHITECTURE_ARM64:
        sysInfo.arch = "arm64";
        break;
    default:
        sysInfo.arch = "unknown";
        break;
    }

    CPUInfo cpu = CPUMonitor::getCPUInfo();
    sysInfo.cpuModel = cpu.modelName;
    sysInfo.cpuCores = cpu.cores;

    MemoryInfo mem = MemoryMonitor::getMemoryInfo();
    sysInfo.totalMemory = mem.total;

    ULONGLONG uptimeMs = GetTickCount64();
    sysInfo.uptime = static_cast<unsigned long long>(uptimeMs / 1000ULL);
#elif defined(__APPLE__)
    sysInfo.platform = "macos";

    {
        std::array<char, 256> buffer;
        if (gethostname(buffer.data(), buffer.size()) == 0)
        {
            sysInfo.hostname = std::string(buffer.data());
        }
        else
        {
            sysInfo.hostname = "unknown";
        }
    }

    struct utsname uts;
    if (uname(&uts) == 0)
    {
        sysInfo.arch = uts.machine;
    }
    else
    {
        sysInfo.arch = "unknown";
    }

    CPUInfo cpu = CPUMonitor::getCPUInfo();
    sysInfo.cpuModel = cpu.modelName;
    sysInfo.cpuCores = cpu.cores;

    MemoryInfo mem = MemoryMonitor::getMemoryInfo();
    sysInfo.totalMemory = mem.total;

    struct timeval boottime;
    size_t len = sizeof(boottime);
    int mib[2] = {CTL_KERN, KERN_BOOTTIME};
    if (sysctl(mib, 2, &boottime, &len, nullptr, 0) == 0)
    {
        time_t current = time(nullptr);
        if (current >= boottime.tv_sec)
        {
            sysInfo.uptime = static_cast<unsigned long long>(current - boottime.tv_sec);
        }
        else
        {
            sysInfo.uptime = 0;
        }
    }
    else
    {
        sysInfo.uptime = 0;
    }
#else
    sysInfo.platform = "unknown";
    sysInfo.hostname = "unknown";
    sysInfo.arch = "unknown";
    sysInfo.cpuModel = "unknown";
    sysInfo.cpuCores = 0;
    sysInfo.totalMemory = 0;
    sysInfo.uptime = 0;
#endif

    return systemInfoToObject(env, sysInfo);
}

Napi::Object MonitorController::GetCPUInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    CPUInfo cpuInfo = CPUMonitor::getCPUInfo();
    return cpuInfoToObject(env, cpuInfo);
}

Napi::Object MonitorController::GetMemoryInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    MemoryInfo memInfo = MemoryMonitor::getMemoryInfo();
    return memoryInfoToObject(env, memInfo);
}

Napi::Object MonitorController::GetDiskInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    std::vector<DiskInfo> disks = DiskMonitor::getDiskInfo();

    Napi::Object result = Napi::Object::New(env);
    result.Set("disks", diskInfoToArray(env, disks));
    return result;
}

Napi::Object MonitorController::GetNetworkInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    std::vector<NetworkInterface> interfaces = NetworkMonitor::getNetworkInfo();

    Napi::Object result = Napi::Object::New(env);
    result.Set("interfaces", networkInfoToArray(env, interfaces));
    return result;
}

Napi::Object MonitorController::GetProcessList(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    std::vector<ProcessInfo> processes;

    ProcessInfo proc;
#ifdef _WIN32
    proc.pid = _getpid();
#else
    proc.pid = getpid();
#endif
    proc.name = "epm-better";
    proc.cpu = 0.0;
    proc.memory = 0;
    processes.emplace_back(proc);

    Napi::Object result = Napi::Object::New(env);
    result.Set("processes", processListToArray(env, processes));
    return result;
}

Napi::Object MonitorController::cpuInfoToObject(Napi::Env env, const CPUInfo &info)
{
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("usage", Napi::Number::New(env, info.usage));
    obj.Set("cores", Napi::Number::New(env, info.cores));
    obj.Set("model", Napi::String::New(env, info.modelName));
    obj.Set("speed", Napi::Number::New(env, info.speed));
    obj.Set("temperature", Napi::Number::New(env, info.temperature));
    return obj;
}

Napi::Object MonitorController::memoryInfoToObject(Napi::Env env, const MemoryInfo &info)
{
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("total", Napi::Number::New(env, static_cast<double>(info.total)));
    obj.Set("used", Napi::Number::New(env, static_cast<double>(info.used)));
    obj.Set("free", Napi::Number::New(env, static_cast<double>(info.free)));
    obj.Set("usagePercent", Napi::Number::New(env, info.usagePercent));
    return obj;
}

Napi::Array MonitorController::diskInfoToArray(Napi::Env env, const std::vector<DiskInfo> &disks)
{
    Napi::Array arr = Napi::Array::New(env, disks.size());
    for (size_t i = 0; i < disks.size(); i++)
    {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("name", Napi::String::New(env, disks[i].name));
        obj.Set("total", Napi::Number::New(env, static_cast<double>(disks[i].total)));
        obj.Set("used", Napi::Number::New(env, static_cast<double>(disks[i].used)));
        obj.Set("free", Napi::Number::New(env, static_cast<double>(disks[i].free)));
        obj.Set("usagePercent", Napi::Number::New(env, disks[i].usagePercent));
        arr[i] = obj;
    }
    return arr;
}

Napi::Array MonitorController::networkInfoToArray(Napi::Env env, const std::vector<NetworkInterface> &interfaces)
{
    Napi::Array arr = Napi::Array::New(env, interfaces.size());
    for (size_t i = 0; i < interfaces.size(); i++)
    {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("name", Napi::String::New(env, interfaces[i].name));
        obj.Set("ip", Napi::String::New(env, interfaces[i].ip));
        obj.Set("mac", Napi::String::New(env, interfaces[i].mac));
        obj.Set("rxBytes", Napi::Number::New(env, static_cast<double>(interfaces[i].rxBytes)));
        obj.Set("txBytes", Napi::Number::New(env, static_cast<double>(interfaces[i].txBytes)));
        obj.Set("rxSpeed", Napi::Number::New(env, static_cast<double>(interfaces[i].rxSpeed)));
        obj.Set("txSpeed", Napi::Number::New(env, static_cast<double>(interfaces[i].txSpeed)));
        arr[i] = obj;
    }
    return arr;
}

Napi::Array MonitorController::processListToArray(Napi::Env env, const std::vector<ProcessInfo> &processes)
{
    Napi::Array arr = Napi::Array::New(env, processes.size());
    for (size_t i = 0; i < processes.size(); i++)
    {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("pid", Napi::Number::New(env, processes[i].pid));
        obj.Set("name", Napi::String::New(env, processes[i].name));
        obj.Set("cpu", Napi::Number::New(env, processes[i].cpu));
        obj.Set("memory", Napi::Number::New(env, static_cast<double>(processes[i].memory)));
        arr[i] = obj;
    }
    return arr;
}

Napi::Object MonitorController::systemInfoToObject(Napi::Env env, const SystemInfo &info)
{
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("platform", Napi::String::New(env, info.platform));
    obj.Set("hostname", Napi::String::New(env, info.hostname));
    obj.Set("arch", Napi::String::New(env, info.arch));
    obj.Set("cpuModel", Napi::String::New(env, info.cpuModel));
    obj.Set("cpuCores", Napi::Number::New(env, info.cpuCores));
    obj.Set("totalMemory", Napi::Number::New(env, static_cast<double>(info.totalMemory)));
    obj.Set("uptime", Napi::Number::New(env, static_cast<double>(info.uptime)));
    return obj;
}

} // namespace epm
