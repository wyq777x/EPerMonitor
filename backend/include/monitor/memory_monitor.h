#pragma once

#include "models/system_info.h"

namespace epm
{

class MemoryMonitor
{
  public:
    static MemoryInfo getMemoryInfo();
};

} // namespace epm
