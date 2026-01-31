"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QR_ECL_PERS = exports.OUTER_EYE_SIZE_IN_BITS = exports.INNER_EYE_SIZE_IN_BITS = exports.EYES_POSITIONS = void 0;
const OUTER_EYE_SIZE_IN_BITS = exports.OUTER_EYE_SIZE_IN_BITS = 7;
const INNER_EYE_SIZE_IN_BITS = exports.INNER_EYE_SIZE_IN_BITS = 3;
const EYES_POSITIONS = exports.EYES_POSITIONS = ['topLeft', 'topRight', 'bottomLeft'];

// QR code error collection percentages
const QR_ECL_PERS = exports.QR_ECL_PERS = {
  L: 0.03,
  M: 0.06,
  Q: 0.1,
  H: 0.14,
  low: 0.03,
  medium: 0.06,
  quartile: 0.1,
  high: 0.14
};
//# sourceMappingURL=constants.js.map