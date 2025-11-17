#pragma once

#include "models/system_info.h"
#include <vector>

namespace epm
{

    class ProcessMonitor
    {
    public:
        static std::vector<ProcessInfo> getProcessList();

    private:
#ifdef _WIN32
        static std::vector<ProcessInfo> getWindowsProcessList();
#elif defined(__linux__)
        static std::vector<ProcessInfo> getLinuxProcessList();
#elif defined(__APPLE__)
        static std::vector<ProcessInfo> getMacOSProcessList();
#endif
    };

} // namespace epm
