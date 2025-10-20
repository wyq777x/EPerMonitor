cmake_minimum_required(VERSION 3.15)
project(system_monitor)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake")

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找 Node.js
find_package(NodeJS REQUIRED)

# 查找 node-addon-api
execute_process(
    COMMAND node -p "require('node-addon-api').include"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

# 移除引号
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

# 包含目录
include_directories(
    ${NodeJS_INCLUDE_DIRS}
    ${NODE_ADDON_API_DIR}
    ${CMAKE_SOURCE_DIR}/include
)

# 源文件
set(SOURCE_FILES
    src/addon.cpp
    src/monitor/cpu_monitor.cpp
    src/monitor/memory_monitor.cpp
    src/monitor/disk_monitor.cpp
    src/monitor/network_monitor.cpp
    src/models/system_info.cpp
    src/controllers/monitor_controller.cpp
)

# 创建 Node.js 插件
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})

# 设置输出名称
set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# 链接库
target_link_libraries(${PROJECT_NAME} ${NodeJS_LIBRARIES})

if(WIN32)
    target_link_libraries(${PROJECT_NAME} iphlpapi ws2_32 advapi32)
elseif(APPLE)
# macOS 链接系统框架（默认链接 libSystem 已包含所需符号）
elseif(UNIX)
    target_link_libraries(${PROJECT_NAME} pthread)
endif()

# 定义 NAPI 版本
target_compile_definitions(${PROJECT_NAME} PRIVATE NAPI_VERSION=8)

# 编译选项
if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -O3)
endif()

# 安装规则
install(TARGETS ${PROJECT_NAME} DESTINATION ${CMAKE_SOURCE_DIR}/build/Release)
