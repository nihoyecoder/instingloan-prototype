/**
 * DEMO LENDER POLICY — document and verification requirements for the prototype.
 *
 * Requirements differ between lenders, so the screens read them from here rather
 * than hard-coding "banking rules". Aadhaar is one accepted identity document,
 * never a mandatory one. Replace with the lending partner's policy service.
 */
export const POLICY = {
  minimumAge: 18,
  pan: { required: true },
  identityProof: {
    required: true,
    /** Any one of these is accepted. */
    acceptedTypes: ['Aadhaar', 'Voter ID', 'Driving Licence', 'Passport'],
  },
  studentProof: { required: true },
  /** Students without personal income can still apply — income proof stays optional. */
  incomeProof: { required: false },
  documents: { maxFileMb: 5, accepted: 'PDF, JPG or PNG' },
} as const

export const LOAN_PURPOSES = [
  'Laptop repair & examination fees',
  'Course or examination fees',
  'Books and study material',
  'Laptop or study device',
  'Hostel or accommodation',
  'Travel for studies',
  'Certification or online course',
  'Other',
]

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

export const COURSES = ['BBA', 'BCom', 'BA', 'BSc', 'BTech', 'BCA', 'MBA', 'MCom', 'MA', 'MSc', 'MTech', 'Diploma']
export const COURSE_LEVELS = ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate', 'Doctorate']
export const STUDY_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
export const STUDENT_STATUSES = ['Currently studying', 'Awaiting final results', 'On a semester break']

export const INCOME_SOURCES = [
  'Internship stipend',
  'Part-time job',
  'Full-time salary',
  'Freelance income',
  'Self-employed',
  'Other accepted source of funds',
] as const
export type IncomeSource = (typeof INCOME_SOURCES)[number]

/** Field wording that adapts to the income source the student picks. */
export const INCOME_COPY: Record<
  IncomeSource,
  { organisation: string; organisationRequired: boolean; amount: string; start: string; end: string | null }
> = {
  'Internship stipend': {
    organisation: 'Organisation / company name',
    organisationRequired: true,
    amount: 'Monthly stipend',
    start: 'Internship start date',
    end: 'Internship end date',
  },
  'Part-time job': {
    organisation: 'Employer name',
    organisationRequired: true,
    amount: 'Monthly income',
    start: 'Start date',
    end: null,
  },
  'Full-time salary': {
    organisation: 'Employer name',
    organisationRequired: true,
    amount: 'Monthly take-home salary',
    start: 'Start date',
    end: null,
  },
  'Freelance income': {
    organisation: 'Main client or platform',
    organisationRequired: false,
    amount: 'Average monthly income',
    start: 'Freelancing since',
    end: null,
  },
  'Self-employed': {
    organisation: 'Business name',
    organisationRequired: true,
    amount: 'Average monthly income',
    start: 'Business started',
    end: null,
  },
  'Other accepted source of funds': {
    organisation: 'Source of funds',
    organisationRequired: true,
    amount: 'Monthly amount',
    start: 'Receiving since',
    end: null,
  },
}

/** Bank names with their IFSC prefix (the first four letters of every IFSC identify the bank). */
export const BANKS = [
  { name: 'HDFC Bank', ifscPrefix: 'HDFC' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK' },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNB' },
  { name: 'Bank of Baroda', ifscPrefix: 'BARB' },
  { name: 'Canara Bank', ifscPrefix: 'CNRB' },
  { name: 'Union Bank of India', ifscPrefix: 'UBIN' },
  { name: 'IDFC FIRST Bank', ifscPrefix: 'IDFB' },
  { name: 'IndusInd Bank', ifscPrefix: 'INDB' },
  { name: 'Yes Bank', ifscPrefix: 'YESB' },
]
