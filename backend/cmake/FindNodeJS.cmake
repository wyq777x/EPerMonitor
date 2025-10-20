# FindNodeJS.cmake
#
# Copyright (c) 2016-2020, Christoph Winkens
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# * Redistributions of source code must retain the above copyright notice, this
#   list of conditions and the following disclaimer.
#
# * Redistributions in binary form must reproduce the above copyright notice,
#   this list of conditions and the following disclaimer in the documentation
#   and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# Find the NodeJS executable and NodeJS libraries
#
# This module defines the following variables:
#
#  NodeJS_FOUND               - True if NodeJS is found.
#  NodeJS_EXECUTABLE          - The path to the NodeJS executable.
#  NodeJS_INCLUDE_DIRS        - The path to the NodeJS include directories.
#  NodeJS_LIBRARIES           - The path to the NodeJS libraries.
#  NodeJS_VERSION_STRING      - The version of NodeJS found (x.y.z).
#  NodeJS_VERSION_MAJOR       - The major version of NodeJS found.
#  NodeJS_VERSION_MINOR       - The minor version of NodeJS found.

# Check if NodeJS is already found
if(NodeJS_FOUND)
    return()
endif()

# Find the NodeJS executable
find_program(NodeJS_EXECUTABLE
    NAMES node nodejs
    DOC "NodeJS executable"
)

# If NodeJS executable is found, get the version
if(NodeJS_EXECUTABLE)
    execute_process(
        COMMAND ${NodeJS_EXECUTABLE} --version
        OUTPUT_VARIABLE NodeJS_VERSION_OUTPUT
        ERROR_QUIET
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
    
    if(NodeJS_VERSION_OUTPUT MATCHES "^v([0-9]+)\\.([0-9]+)\\.([0-9]+)")
        set(NodeJS_VERSION_STRING "${CMAKE_MATCH_1}.${CMAKE_MATCH_2}.${CMAKE_MATCH_3}")
        set(NodeJS_VERSION_MAJOR "${CMAKE_MATCH_1}")
        set(NodeJS_VERSION_MINOR "${CMAKE_MATCH_2}")
    endif()
endif()

# Find the NodeJS include directories
if(NodeJS_EXECUTABLE)
    execute_process(
        COMMAND ${NodeJS_EXECUTABLE} -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/..
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
    string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

    execute_process(
        COMMAND ${NodeJS_EXECUTABLE} -p "process.env.npm_config_nodedir || process.env.NODE_DIR || (process.platform === 'win32' ? '' : '/usr/local')"
        OUTPUT_VARIABLE NODE_DIR
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )

    if(NODE_DIR)
        find_path(NodeJS_INCLUDE_DIRS
            NAMES node.h
            HINTS ${NODE_DIR}/include/node
        )
    else()
        find_path(NodeJS_INCLUDE_DIRS
            NAMES node.h
            HINTS /usr/local/include/node /usr/include/node
        )
    endif()
endif()

# Find the NodeJS libraries
if(NodeJS_EXECUTABLE)
    # On Windows, we don't need to link to any libraries
    if(WIN32)
        set(NodeJS_LIBRARIES "")
    else()
        # On other platforms, we need to find the library
        find_library(NodeJS_LIBRARIES
            NAMES node
            HINTS /usr/local/lib /usr/lib
        )
    endif()
endif()

# Include FindPackageHandleStandardArgs to handle standard arguments
include(FindPackageHandleStandardArgs)

# Handle the standard arguments for find_package
find_package_handle_standard_args(NodeJS
    REQUIRED_VARS NodeJS_EXECUTABLE NodeJS_INCLUDE_DIRS
    VERSION_VAR NodeJS_VERSION_STRING
)

# Mark variables as advanced
mark_as_advanced(
    NodeJS_EXECUTABLE
    NodeJS_INCLUDE_DIRS
    NodeJS_LIBRARIES
)
