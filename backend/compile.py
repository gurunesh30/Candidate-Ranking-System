import os
import sys
from setuptools import setup, Extension
import pybind11

functions_module = Extension(
    'cpp_ranker',
    sources=['src/ranker.cpp'],
    include_dirs=[pybind11.get_include()],
    language='c++',
    extra_compile_args=['/O2', '/std:c++11'] if sys.platform == 'win32' else ['-O3', '-std=c++11']
)

setup(
    name='cpp_ranker',
    version='1.0',
    ext_modules=[functions_module],
    script_args=['build_ext', '--inplace']
)
print("\n Done! Compilation finished successfully.")