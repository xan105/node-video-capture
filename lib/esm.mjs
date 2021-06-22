//ES Module Wrapper
//https://nodejs.org/api/esm.html#esm_dual_commonjs_es_module_packages

import module from "./capture.cjs";
export const h264_hwencode = module.h264_hwencode;
export const hvec_hwencode = module.hvec_hwencode;
