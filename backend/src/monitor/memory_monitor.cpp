#include "monitor/memory_monitor.h"
#include <cstring>
#include <fstream>
#include <sstream>

#ifdef __linux__
#include <sys/sysinfo.h>
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
#elif defined(__APPLE__)
#include <mach/mach.h>
#include <sys/sysctl.h>
#include <unistd.h>
#endif

namespace epm
{

MemoryInfo MemoryMonitor::getMemoryInfo()
{
    MemoryInfo info;

#if defined(__linux__)
    unsigned long long memTotal = 0, memAvailable = 0;
    std::ifstream meminfo("/proc/meminfo");
    std::string line;
    while (std::getline(meminfo, line))
    {
        if (line.find("MemTotal:") == 0)
        {
            std::istringstream iss(line.substr(9));
            iss >> memTotal;
        }
        else if (line.find("MemAvailable:") == 0)
        {
            std::istringstream iss(line.substr(13));
            iss >> memAvailable;
        }
    }

    info.total = memTotal * 1024;
    info.free = memAvailable * 1024;
    info.used = info.total > info.free ? info.total - info.free : 0;
    info.usagePercent = info.total > 0 ? (static_cast<double>(info.used) / info.total) * 100.0 : 0.0;
#elif defined(_WIN32)
    MEMORYSTATUSEX status;
    status.dwLength = sizeof(status);
    if (GlobalMemoryStatusEx(&status))
    {
        info.total = status.ullTotalPhys;
        info.free = status.ullAvailPhys;
        info.used = info.total - info.free;
        info.usagePercent = info.total > 0 ? (static_cast<double>(info.used) / info.total) * 100.0 : 0.0;
    }
    else
    {
        info.total = 0;
        info.used = 0;
        info.free = 0;
        info.usagePercent = 0.0;
    }
#elif defined(__APPLE__)
    uint64_t totalMemory = 0;
    size_t size = sizeof(totalMemory);
    if (sysctlbyname("hw.memsize", &totalMemory, &size, nullptr, 0) == 0)
    {
        info.total = totalMemory;
    }
    else
    {
        info.total = 0;
    }

    mach_msg_type_number_t count = HOST_VM_INFO64_COUNT;
    vm_statistics64_data_t vmStats;
    if (host_statistics64(mach_host_self(), HOST_VM_INFO64, reinterpret_cast<host_info64_t>(&vmStats), &count) ==
        KERN_SUCCESS)
    {
        const uint64_t pageSize = static_cast<uint64_t>(sysconf(_SC_PAGESIZE));
        uint64_t freeMemory =
            (static_cast<uint64_t>(vmStats.free_count) + static_cast<uint64_t>(vmStats.inactive_count)) * pageSize;
        info.free = freeMemory;
        if (info.total > freeMemory)
        {
            info.used = info.total - freeMemory;
            info.usagePercent = info.total > 0 ? (static_cast<double>(info.used) / info.total) * 100.0 : 0.0;
        }
        else
        {
            info.used = 0;
            info.usagePercent = 0.0;
        }
    }
    else
    {
        info.used = 0;
        info.free = info.total;
        info.usagePercent = 0.0;
    }
#else
    info.total = 0;
    info.used = 0;
    info.free = 0;
    info.usagePercent = 0.0;
#endif

    return info;
}

} // namespace epm
