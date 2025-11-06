#pragma once

#include <string>
#include <vector>

namespace epm
{

struct CPUInfo
{
    double usage;
    int cores;
    std::string modelName;
    int speed;
    double temperature;
};

struct MemoryInfo
{
    unsigned long long total;
    unsigned long long used;
    unsigned long long free;
    double usagePercent;
};

struct DiskInfo
{
    std::string name;
    unsigned long long total;
    unsigned long long used;
    unsigned long long free;
    double usagePercent;
};

struct NetworkInterface
{
    std::string name;
    std::string ip;
    std::string mac;
    unsigned long long rxBytes;
    unsigned long long txBytes;
    unsigned long long rxSpeed;
    unsigned long long txSpeed;
};

struct ProcessInfo
{
    int pid;
    std::string name;
    double cpu;
    unsigned long long memory;
};

struct SystemInfo
{
    std::string platform;
    std::string hostname;
    std::string arch;
    std::string cpuModel;
    int cpuCores;
    unsigned long long totalMemory;
    unsigned long long uptime;
};

} // namespace epm
