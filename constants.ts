import type { BoardLayout } from './types';

export const BOARD_CHARS: BoardLayout = {
  topElements: ["YES", "NO"],
  alphabetArc1: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
  alphabetArc2: ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
  numbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  bottomElement: ["GOOD BYE"]
};

export const ANIMATION_DELAY = 1200; // ms between character movements
export const CHAR_MOVE_DURATION = 800; // ms for CSS transition