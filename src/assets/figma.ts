/**
 * Figma asset registry — Quick Student Loan.
 *
 * Illustrations and category icons in the Figma file are crops of larger
 * reference renders. Each crop reproduces Figma's exact framing: a fixed box
 * with the source image scaled and offset by percentages (straight from the
 * design file, frames 45:124 … 45:260, 50:225 and 50:335).
 */
import appSprite from './figma/sprites/app-sprite.png'
import bankSprite from './figma/sprites/bank-sprite.png'
import detailsSprite from './figma/sprites/details-sprite.png'
import incomeSprite from './figma/sprites/income-sprite.png'
import kycSprite from './figma/sprites/kyc-sprite.png'
import loanSprite from './figma/sprites/loan-sprite.png'
import repaymentCalendarImage from './figma/sprites/repayment-calendar.png'
import startSprite from './figma/sprites/start-sprite.png'
import statusSprite from './figma/sprites/status-sprite.png'
import submittedSprite from './figma/sprites/submitted-sprite.png'
import summarySprite from './figma/sprites/summary-sprite.png'
import trackingSprite from './figma/sprites/tracking-sprite.png'

import arrowRightIcon from './figma/icons/arrow-right.svg'
import backIcon from './figma/icons/back.svg'
import bellIcon from './figma/icons/bell.svg'
import editPencilIcon from './figma/icons/edit-pencil.svg'
import fieldCalendarIcon from './figma/icons/field-calendar.svg'
import fileIcon from './figma/icons/file.svg'
import helpIcon from './figma/icons/help.svg'
import radioOffIcon from './figma/icons/radio-off.svg'
import radioOnIcon from './figma/icons/radio-on.svg'
import selectChevronIcon from './figma/icons/select-chevron.svg'
import uploadAccentIcon from './figma/icons/upload-accent.svg'

export interface SpriteCrop {
  src: string
  /** Box size in px */
  width: number
  height: number
  /** Image size and offset, as % of the box (straight from Figma) */
  imageWidth: number
  imageHeight: number
  left: number
  top: number
}

function crop(
  src: string,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  left: number,
  top: number,
): SpriteCrop {
  return { src, width, height, imageWidth, imageHeight, left, top }
}

export const sprites = {
  // Shared chrome
  brandMark: crop(appSprite, 26, 27, 1642.59, 3167.86, -170.37, -300),
  statusIcons: crop(appSprite, 70, 18, 633.57, 4927.78, -462.86, -205.56),

  // 01 – Start your application
  startHero: crop(startSprite, 170, 188, 240.82, 474.07, -131.63, -62.96),
  startPersonal: crop(startSprite, 58, 62, 621.05, 1248.78, -47.37, -575.61),
  startKyc: crop(startSprite, 58, 62, 621.05, 1248.78, -47.37, -717.07),
  startBank: crop(startSprite, 58, 62, 621.05, 1248.78, -47.37, -858.54),

  // 02 – Loan details and the repayment breakdown sheet
  loanAmount: crop(loanSprite, 36, 36, 1024, 2133.33, -112, -904.17),
  loanPurpose: crop(loanSprite, 36, 36, 1024, 2133.33, -112, -1112.5),
  loanTenure: crop(loanSprite, 36, 36, 1024, 2133.33, -112, -1312.5),
  loanEstimate: crop(loanSprite, 30, 32, 1113.04, 2133.33, -130.43, -1575),
  repaymentCalendar: crop(repaymentCalendarImage, 80, 77, 1380.04, 906.09, -753.67, -466.07),

  // 03 – Your details
  detailsPersonal: crop(detailsSprite, 27, 27, 1163.64, 2844.44, -127.27, -938.89),
  detailsStudent: crop(detailsSprite, 27, 27, 1163.64, 2694.74, -127.27, -1726.32),

  // 04 – Income details
  incomeProof: crop(incomeSprite, 34, 36, 1024, 1969.23, -112, -1488.46),

  // 05 – KYC & documents
  kycPan: crop(kycSprite, 36, 34, 1066.67, 2327.27, -116.67, -986.36),
  kycIdentity: crop(kycSprite, 36, 33, 1066.67, 2327.27, -116.67, -1213.64),
  kycStudent: crop(kycSprite, 36, 33, 1066.67, 2327.27, -116.67, -1522.73),
  kycIncome: crop(kycSprite, 36, 36, 1024, 2048, -112, -1612),

  // 06 – Bank account
  bankShield: crop(bankSprite, 34, 31, 1066.67, 2378.32, -120.83, -1793.03),

  // 07 – Review & consent (the student tile comes from the same reference render)
  reviewLoan: crop(summarySprite, 34, 31, 1066.67, 2327.27, -116.67, -1359.09),
  reviewPersonal: crop(summarySprite, 34, 31, 1066.67, 2327.27, -116.67, -736.36),
  reviewStudent: crop(summarySprite, 34, 31, 1066.67, 2327.27, -116.67, -859.09),
  reviewIncome: crop(summarySprite, 34, 31, 1066.67, 2327.27, -116.67, -977.27),
  reviewKyc: crop(summarySprite, 34, 31, 1066.67, 2327.27, -116.67, -1104.55),
  reviewBank: crop(summarySprite, 34, 31, 1066.67, 2327.27, -116.67, -1218.18),

  // 08 – Application submitted (cap and coins are reused on 09)
  submittedHero: crop(submittedSprite, 260, 170, 162.07, 538.95, -30.34, -65.26),
  loanCap: crop(submittedSprite, 38, 32, 979.17, 2560, -79.17, -1320),
  loanCoins: crop(submittedSprite, 33, 33, 1021.74, 2226.09, -573.91, -1147.83),

  // 09 – Track application
  statusHero: crop(statusSprite, 142, 126, 252.69, 602.35, -136.56, -105.88),
  statusCalendar: crop(statusSprite, 37, 41, 903.85, 1765.52, -103.85, -1448.28),
  supportHeadset: crop(trackingSprite, 25, 26, 1774, 3411.54, -404, -3023.08),
} satisfies Record<string, SpriteCrop>

export interface IconAsset {
  src: string
  /** Intrinsic size from the exported SVG root — never overridden */
  width: number
  height: number
}

export const icons = {
  back: { src: backIcon, width: 17.7, height: 15.7 },
  bell: { src: bellIcon, width: 16.2833, height: 18.3667 },
  help: { src: helpIcon, width: 19.7, height: 19.7 },
  arrowRight: { src: arrowRightIcon, width: 18.2, height: 14.5333 },
  selectChevron: { src: selectChevronIcon, width: 8.13432, height: 5.00257 },
  calendar: { src: fieldCalendarIcon, width: 14, height: 14 },
  upload: { src: uploadAccentIcon, width: 13, height: 13 },
  radioOn: { src: radioOnIcon, width: 12.5, height: 12.5 },
  radioOff: { src: radioOffIcon, width: 12.5, height: 12.5 },
  file: { src: fileIcon, width: 18.3333, height: 17.875 },
  editPencil: { src: editPencilIcon, width: 12, height: 12 },
} satisfies Record<string, IconAsset>
