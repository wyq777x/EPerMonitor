#pragma once

#include "models/system_info.h"
#include <vector>

namespace epm
{

  class NetworkMonitor
  {
  public:
    static std::vector<NetworkInterface> getNetworkInfo();
  };

} // namespace epm
