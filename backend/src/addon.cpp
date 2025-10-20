#include "controllers/monitor_controller.h"
#include <napi.h>

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "getSystemInfo"),
                Napi::Function::New(env, epm::MonitorController::GetSystemInfo));

    exports.Set(Napi::String::New(env, "getCPUInfo"), Napi::Function::New(env, epm::MonitorController::GetCPUInfo));

    exports.Set(Napi::String::New(env, "getMemoryInfo"),
                Napi::Function::New(env, epm::MonitorController::GetMemoryInfo));

    exports.Set(Napi::String::New(env, "getDiskInfo"), Napi::Function::New(env, epm::MonitorController::GetDiskInfo));

    exports.Set(Napi::String::New(env, "getNetworkInfo"),
                Napi::Function::New(env, epm::MonitorController::GetNetworkInfo));

    exports.Set(Napi::String::New(env, "getProcessList"),
                Napi::Function::New(env, epm::MonitorController::GetProcessList));

    return exports;
}

NODE_API_MODULE(system_monitor, Init)
