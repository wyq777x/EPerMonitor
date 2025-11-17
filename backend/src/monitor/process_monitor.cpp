#include "monitor/process_monitor.h"
#include <algorithm>
#include <fstream>
#include <sstream>
#include <map>

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <psapi.h>
#include <tlhelp32.h>
#pragma comment(lib, "psapi.lib")
#elif defined(__linux__)
#include <dirent.h>
#include <unistd.h>
#include <sys/types.h>
#include <fstream>
#elif defined(__APPLE__)
#include <sys/sysctl.h>
#include <libproc.h>
#endif

namespace epm
{
    // 进程CPU时间缓存结构
    struct ProcessCPUData
    {
        unsigned long long lastCPUTime;
        unsigned long long lastSystemTime;
        double cpuUsage;
    };

    // 静态缓存，存储每个进程的历史CPU数据
    static std::map<int, ProcessCPUData> processCPUCache;

    std::vector<ProcessInfo> ProcessMonitor::getProcessList()
    {
#ifdef _WIN32
        return getWindowsProcessList();
#elif defined(__linux__)
        return getLinuxProcessList();
#elif defined(__APPLE__)
        return getMacOSProcessList();
#else
        return std::vector<ProcessInfo>();
#endif
    }

#ifdef _WIN32
    std::vector<ProcessInfo> ProcessMonitor::getWindowsProcessList()
    {
        std::vector<ProcessInfo> processes;

        // 获取当前系统时间
        FILETIME nowFileTime;
        GetSystemTimeAsFileTime(&nowFileTime);
        ULARGE_INTEGER nowTime;
        nowTime.LowPart = nowFileTime.dwLowDateTime;
        nowTime.HighPart = nowFileTime.dwHighDateTime;
        unsigned long long currentSystemTime = nowTime.QuadPart;

        // 创建进程快照
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE)
        {
            return processes;
        }

        PROCESSENTRY32W pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32W);

        // 获取第一个进程信息
        if (!Process32FirstW(hSnapshot, &pe32))
        {
            CloseHandle(hSnapshot);
            return processes;
        }

        // 获取系统CPU核心数
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        int numProcessors = sysInfo.dwNumberOfProcessors;

        // 遍历所有进程
        do
        {
            ProcessInfo info;
            info.pid = static_cast<int>(pe32.th32ProcessID);

            // 转换进程名称从宽字符到多字节字符
            char name[MAX_PATH];
            WideCharToMultiByte(CP_UTF8, 0, pe32.szExeFile, -1, name, MAX_PATH, nullptr, nullptr);
            info.name = name;

            // 打开进程以获取更多信息
            HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pe32.th32ProcessID);
            if (hProcess != nullptr)
            {
                // 获取内存信息
                PROCESS_MEMORY_COUNTERS_EX pmc;
                if (GetProcessMemoryInfo(hProcess, reinterpret_cast<PROCESS_MEMORY_COUNTERS *>(&pmc), sizeof(pmc)))
                {
                    info.memory = static_cast<unsigned long long>(pmc.WorkingSetSize);
                }
                else
                {
                    info.memory = 0;
                }

                // 计算CPU使用率
                FILETIME createTime, exitTime, kernelTime, userTime;
                if (GetProcessTimes(hProcess, &createTime, &exitTime, &kernelTime, &userTime))
                {
                    ULARGE_INTEGER kernel, user;
                    kernel.LowPart = kernelTime.dwLowDateTime;
                    kernel.HighPart = kernelTime.dwHighDateTime;
                    user.LowPart = userTime.dwLowDateTime;
                    user.HighPart = userTime.dwHighDateTime;

                    unsigned long long totalCPUTime = kernel.QuadPart + user.QuadPart;

                    // 查找缓存中的历史数据
                    auto it = processCPUCache.find(info.pid);
                    if (it != processCPUCache.end())
                    {
                        // 计算CPU时间差和系统时间差
                        unsigned long long cpuTimeDelta = totalCPUTime - it->second.lastCPUTime;
                        unsigned long long systemTimeDelta = currentSystemTime - it->second.lastSystemTime;

                        if (systemTimeDelta > 0)
                        {
                            // CPU使用率 = (CPU时间差 / 系统时间差) * 100
                            double cpuUsage = (static_cast<double>(cpuTimeDelta) / systemTimeDelta) * 100.0;
                            info.cpu = cpuUsage;
                            it->second.cpuUsage = cpuUsage;
                        }
                        else
                        {
                            info.cpu = it->second.cpuUsage; // 使用上次的值
                        }

                        // 更新缓存
                        it->second.lastCPUTime = totalCPUTime;
                        it->second.lastSystemTime = currentSystemTime;
                    }
                    else
                    {
                        // 首次采样，添加到缓存
                        ProcessCPUData data;
                        data.lastCPUTime = totalCPUTime;
                        data.lastSystemTime = currentSystemTime;
                        data.cpuUsage = 0.0;
                        processCPUCache[info.pid] = data;
                        info.cpu = 0.0;
                    }
                }
                else
                {
                    info.cpu = 0.0;
                }

                CloseHandle(hProcess);
            }
            else
            {
                info.memory = 0;
                info.cpu = 0.0;
            }

            processes.emplace_back(info);

        } while (Process32NextW(hSnapshot, &pe32));

        CloseHandle(hSnapshot);

        // 清理已不存在的进程的缓存数据
        std::vector<int> toRemove;
        for (auto &pair : processCPUCache)
        {
            bool found = false;
            for (const auto &proc : processes)
            {
                if (proc.pid == pair.first)
                {
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                toRemove.push_back(pair.first);
            }
        }
        for (int pid : toRemove)
        {
            processCPUCache.erase(pid);
        }

        // 按内存使用量排序，取前20个
        std::sort(processes.begin(), processes.end(),
                  [](const ProcessInfo &a, const ProcessInfo &b)
                  {
                      return a.memory > b.memory;
                  });

        if (processes.size() > 20)
        {
            processes.resize(20);
        }

        return processes;
    }
#endif

#ifdef __linux__
    std::vector<ProcessInfo> ProcessMonitor::getLinuxProcessList()
    {
        std::vector<ProcessInfo> processes;

        DIR *dir = opendir("/proc");
        if (dir == nullptr)
        {
            return processes;
        }

        struct dirent *entry;
        while ((entry = readdir(dir)) != nullptr)
        {
            // 只处理数字目录（进程ID）
            if (entry->d_type != DT_DIR)
                continue;

            int pid = atoi(entry->d_name);
            if (pid <= 0)
                continue;

            ProcessInfo info;
            info.pid = pid;

            // 读取进程名称
            std::string statPath = "/proc/" + std::string(entry->d_name) + "/stat";
            std::ifstream statFile(statPath);
            if (statFile.is_open())
            {
                std::string line;
                std::getline(statFile, line);

                // 解析stat文件
                size_t start = line.find('(');
                size_t end = line.find(')');
                if (start != std::string::npos && end != std::string::npos)
                {
                    info.name = line.substr(start + 1, end - start - 1);
                }
            }

            // 读取内存信息
            std::string statusPath = "/proc/" + std::string(entry->d_name) + "/status";
            std::ifstream statusFile(statusPath);
            if (statusFile.is_open())
            {
                std::string line;
                while (std::getline(statusFile, line))
                {
                    if (line.find("VmRSS:") == 0)
                    {
                        std::istringstream iss(line);
                        std::string key;
                        unsigned long long value;
                        std::string unit;
                        iss >> key >> value >> unit;
                        info.memory = value * 1024; // 转换为字节
                        break;
                    }
                }
            }

            info.cpu = 0.0;

            processes.emplace_back(info);
        }

        closedir(dir);

        // 按内存使用量排序，取前20个
        std::sort(processes.begin(), processes.end(),
                  [](const ProcessInfo &a, const ProcessInfo &b)
                  {
                      return a.memory > b.memory;
                  });

        if (processes.size() > 20)
        {
            processes.resize(20);
        }

        return processes;
    }
#endif

#ifdef __APPLE__
    std::vector<ProcessInfo> ProcessMonitor::getMacOSProcessList()
    {
        std::vector<ProcessInfo> processes;

        int mib[4] = {CTL_KERN, KERN_PROC, KERN_PROC_ALL, 0};
        size_t size = 0;

        if (sysctl(mib, 4, nullptr, &size, nullptr, 0) < 0)
        {
            return processes;
        }

        struct kinfo_proc *procList = static_cast<struct kinfo_proc *>(malloc(size));
        if (procList == nullptr)
        {
            return processes;
        }

        if (sysctl(mib, 4, procList, &size, nullptr, 0) < 0)
        {
            free(procList);
            return processes;
        }

        size_t procCount = size / sizeof(struct kinfo_proc);

        for (size_t i = 0; i < procCount; i++)
        {
            ProcessInfo info;
            info.pid = procList[i].kp_proc.p_pid;
            info.name = procList[i].kp_proc.p_comm;

            // 获取内存信息
            struct proc_taskinfo taskInfo;
            int result = proc_pidinfo(info.pid, PROC_PIDTASKINFO, 0, &taskInfo, sizeof(taskInfo));
            if (result == sizeof(taskInfo))
            {
                info.memory = taskInfo.pti_resident_size;
            }
            else
            {
                info.memory = 0;
            }

            info.cpu = 0.0;

            processes.emplace_back(info);
        }

        free(procList);

        // 按内存使用量排序，取前20个
        std::sort(processes.begin(), processes.end(),
                  [](const ProcessInfo &a, const ProcessInfo &b)
                  {
                      return a.memory > b.memory;
                  });

        if (processes.size() > 20)
        {
            processes.resize(20);
        }

        return processes;
    }
#endif

} // namespace epm
