#pragma once

#include "models/system_info.h"
#include <napi.h>
#include <vector>

namespace epm
{

class MonitorController
{
  public:
    static Napi::Object GetSystemInfo(const Napi::CallbackInfo &info);

    static Napi::Object GetCPUInfo(const Napi::CallbackInfo &info);

    static Napi::Object GetMemoryInfo(const Napi::CallbackInfo &info);

    static Napi::Object GetDiskInfo(const Napi::CallbackInfo &info);

    static Napi::Object GetNetworkInfo(const Napi::CallbackInfo &info);

    static Napi::Object GetProcessList(const Napi::CallbackInfo &info);

  private:
    static Napi::Object cpuInfoToObject(Napi::Env env, const CPUInfo &info);
    static Napi::Object memoryInfoToObject(Napi::Env env, const MemoryInfo &info);
    static Napi::Array diskInfoToArray(Napi::Env env, const std::vector<DiskInfo> &disks);
    static Napi::Array networkInfoToArray(Napi::Env env, const std::vector<NetworkInterface> &interfaces);
    static Napi::Array processListToArray(Napi::Env env, const std::vector<ProcessInfo> &processes);
    static Napi::Object systemInfoToObject(Napi::Env env, const SystemInfo &info);
};

} // namespace epm
