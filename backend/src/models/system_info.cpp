#include "models/system_info.h"
#include <type_traits>

namespace epm
{
static_assert(std::is_same_v<decltype(CPUInfo{}.modelName), std::string>, "CPUInfo::modelName should exist");

} // namespace epm
