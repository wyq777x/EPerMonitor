#pragma once

#include "models/system_info.h"
#include <vector>

namespace epm
{

class DiskMonitor
{
  public:
    static std::vector<DiskInfo> getDiskInfo();
};

} // namespace epm
