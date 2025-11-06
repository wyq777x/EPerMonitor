#pragma once

#include "models/system_info.h"

namespace epm
{

class CPUMonitor
{
  public:
    static CPUInfo getCPUInfo();

  private:
    static double calculateCPUUsage();
    static double getCPUTemperature();
    static std::string getCPUModel();
    static int getCPUCores();
    static int getCPUSpeed();
};

} // namespace epm
