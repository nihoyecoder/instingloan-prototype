import { useRef, useState, type ReactNode } from 'react'
import { sprites, type SpriteCrop } from '../assets/figma'
import { HelpSheet } from '../components/AppSheets'
import { PageNav } from '../components/PageNav'
import { ScreenLayout, StepFooter, focusFirstError } from '../components/ScreenLayout'
import { COURSES, COURSE_LEVELS, INDIAN_STATES, STUDENT_STATUSES, STUDY_YEARS } from '../config/policy'
import { formatDisplayDate } from '../lib/date'
import { formatMobileWithCode } from '../lib/format'
import { useApplication } from '../state/ApplicationProvider'
import type { Personal, Student } from '../state/types'
import { hasErrors, validatePersonal, validateStudent, type PersonalKey, type StudentKey } from '../state/validation'
import { DateSheet } from '../ui/DateSheet'
import { FieldLabel, PickerField, TextField, inputShell } from '../ui/Field'
import { InfoTip } from '../ui/InfoTip'
import { OptionSheet } from '../ui/OptionSheet'
import { Sprite } from '../ui/Sprite'

function DetailsCard({ id, crop, title, why, children }: { id: string; crop: SpriteCrop; title: string; why: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-2 rounded-12 border-[0.7px] border-line bg-card p-2">
      <div className="flex items-center gap-2">
        <Sprite crop={crop} />
        <h2 id={`${id}-title`} className="text-[16px] font-bold leading-5 text-ink">
          {title}
        </h2>
        <InfoTip topic={title.toLowerCase()}>{why}</InfoTip>
      </div>
      {children}
    </section>
  )
}

type Picker =
  | { kind: 'dob' }
  | { kind: 'list'; title: string; options: string[]; value: string; onSelect: (value: string) => void; searchable?: boolean; allowCustom?: boolean }

const PERSONAL_ORDER: PersonalKey[] = ['fullName', 'dob', 'email', 'address', 'city', 'state', 'pinCode']
const STUDENT_ORDER: StudentKey[] = ['institution', 'course', 'courseLevel', 'yearOfStudy', 'status']

/** 03 – Your details (Figma 45:158) · step 2 of 6. Prefilled from the student's registered profile. */
export function YourDetailsScreen() {
  const { state, actions } = useApplication()
  const { personal, student } = state
  const [attempted, setAttempted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<PersonalKey | StudentKey, boolean>>>({})
  const [picker, setPicker] = useState<Picker | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const personalErrors = validatePersonal(personal)
  const studentErrors = validateStudent(student)
  const show = (key: PersonalKey | StudentKey, error?: string) => (attempted || touched[key] ? error : undefined)
  const touch = (key: PersonalKey | StudentKey) => setTouched((current) => ({ ...current, [key]: true }))
  const setPersonal = (patch: Partial<Personal>) => actions.updatePersonal(patch)
  const setStudent = (patch: Partial<Student>) => actions.updateStudent(patch)
  const thisYear = new Date().getFullYear()
  // Keep the last list on screen while its sheet animates closed.
  const lastList = useRef<Extract<Picker, { kind: 'list' }> | null>(null)
  if (picker?.kind === 'list') lastList.current = picker
  const listView = lastList.current

  const list = (title: string, options: string[], value: string, onSelect: (value: string) => void, extra?: Partial<Extract<Picker, { kind: 'list' }>>) =>
    setPicker({ kind: 'list', title, options, value, onSelect, ...extra })

  const onContinue = () => {
    setAttempted(true)
    if (hasErrors(personalErrors) || hasErrors(studentErrors)) {
      focusFirstError([
        ...PERSONAL_ORDER.filter((key) => personalErrors[key]).map((key) => `details-${key}`),
        ...STUDENT_ORDER.filter((key) => studentErrors[key]).map((key) => `student-${key}`),
      ])
      return
    }
    actions.goNext()
  }

  return (
    <ScreenLayout
      nav={
        <PageNav
          title="Your Details"
          onBack={actions.goBack}
          backLabel={state.returnTo ? 'Back to review' : 'Back to loan details'}
          right="help"
          onRight={() => setHelpOpen(true)}
        />
      }
      step={2}
      contentClassName="gap-6 pt-6 pb-6"
      footer={<StepFooter onContinue={onContinue} />}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-page text-ink">Your details</h1>
        <p className="text-[13px] leading-[17px] text-muted">Tell us about yourself and your current study.</p>
      </div>

      <DetailsCard
        id="personal"
        crop={sprites.detailsPersonal}
        title="Personal details"
        why="We use these details to identify you and contact you about your application."
      >
        <TextField
          id="details-fullName"
          label="Full legal name"
          required
          value={personal.fullName}
          onValueChange={(fullName) => setPersonal({ fullName })}
          onBlur={() => touch('fullName')}
          autoComplete="name"
          autoCapitalize="words"
          placeholder="As on your PAN"
          error={show('fullName', personalErrors.fullName)}
        />
        <div className="flex gap-3">
          {/* A little narrower than half, so a full email address stays readable. */}
          <div className="flex w-[42%] shrink-0">
            <PickerField
              id="details-dob"
              kind="date"
              label="Date of birth"
              required
              value={personal.dob ? formatDisplayDate(personal.dob) : ''}
              placeholder="DD MMM YYYY"
              onOpen={() => setPicker({ kind: 'dob' })}
              error={show('dob', personalErrors.dob)}
            />
          </div>
          <TextField
            id="details-email"
            label="Email address"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            value={personal.email}
            onValueChange={(email) => setPersonal({ email: email.trim() })}
            onBlur={() => touch('email')}
            placeholder="name@example.com"
            error={show('email', personalErrors.email)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel id="details-mobile-label">Mobile number</FieldLabel>
          <div
            aria-labelledby="details-mobile-label"
            className={`${inputShell} h-[30px] justify-between border-line bg-canvas text-[12px] leading-[15px] text-ink`}
          >
            <span>{formatMobileWithCode(personal.mobile)}</span>
            <span className="text-[9px] leading-[12px] text-muted">Registered · can’t be edited here</span>
          </div>
        </div>
        <TextField
          id="details-address"
          label="Residential address"
          required
          value={personal.address}
          onValueChange={(address) => setPersonal({ address })}
          onBlur={() => touch('address')}
          autoComplete="street-address"
          placeholder="House number, street and area"
          error={show('address', personalErrors.address)}
        />
        <div className="flex gap-2">
          <TextField
            id="details-city"
            label="City"
            required
            value={personal.city}
            onValueChange={(city) => setPersonal({ city })}
            onBlur={() => touch('city')}
            autoComplete="address-level2"
            error={show('city', personalErrors.city)}
          />
          <PickerField
            id="details-state"
            label="State"
            required
            compact
            value={personal.state}
            placeholder="Select"
            onOpen={() => list('State', INDIAN_STATES, personal.state, (value) => setPersonal({ state: value }), { searchable: true })}
            error={show('state', personalErrors.state)}
          />
          <TextField
            id="details-pinCode"
            label="PIN code"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            value={personal.pinCode}
            onValueChange={(value) => setPersonal({ pinCode: value.replace(/\D/g, '').slice(0, 6) })}
            onBlur={() => touch('pinCode')}
            placeholder="6 digits"
            error={show('pinCode', personalErrors.pinCode)}
          />
        </div>
      </DetailsCard>

      <DetailsCard
        id="student"
        crop={sprites.detailsStudent}
        title="Student details"
        why="This helps establish your current student status."
      >
        <TextField
          id="student-institution"
          label="Institution / college name"
          required
          value={student.institution}
          onValueChange={(institution) => setStudent({ institution })}
          onBlur={() => touch('institution')}
          placeholder="Where you study"
          error={show('institution', studentErrors.institution)}
        />
        <div className="flex gap-3">
          <PickerField
            id="student-course"
            label="Course name"
            required
            value={student.course}
            placeholder="Select course"
            onOpen={() => list('Course name', COURSES, student.course, (course) => setStudent({ course }), { searchable: true, allowCustom: true })}
            error={show('course', studentErrors.course)}
          />
          <PickerField
            id="student-courseLevel"
            label="Course level"
            required
            value={student.courseLevel}
            placeholder="Select level"
            onOpen={() => list('Course level', COURSE_LEVELS, student.courseLevel, (courseLevel) => setStudent({ courseLevel }))}
            error={show('courseLevel', studentErrors.courseLevel)}
          />
        </div>
        <div className="flex gap-3">
          <PickerField
            id="student-yearOfStudy"
            label="Current year of study"
            required
            value={student.yearOfStudy}
            placeholder="Select year"
            onOpen={() => list('Current year of study', STUDY_YEARS, student.yearOfStudy, (yearOfStudy) => setStudent({ yearOfStudy }))}
            error={show('yearOfStudy', studentErrors.yearOfStudy)}
          />
          <PickerField
            id="student-status"
            label="Student status"
            required
            value={student.status}
            placeholder="Select status"
            onOpen={() => list('Student status', STUDENT_STATUSES, student.status, (status) => setStudent({ status }))}
            error={show('status', studentErrors.status)}
          />
        </div>
      </DetailsCard>

      <DateSheet
        open={picker?.kind === 'dob'}
        onClose={() => {
          setPicker(null)
          touch('dob')
        }}
        title="Date of birth"
        description="As shown on your PAN."
        value={personal.dob}
        fallback="2005-01-01"
        minYear={thisYear - 80}
        maxYear={thisYear - 16}
        onSelect={(dob) => setPersonal({ dob })}
      />
      <OptionSheet
        open={picker?.kind === 'list'}
        onClose={() => setPicker(null)}
        title={listView?.title ?? ''}
        options={listView?.options ?? []}
        value={listView?.value ?? ''}
        onSelect={(value) => listView?.onSelect(value)}
        searchable={listView?.searchable}
        searchPlaceholder={`Search ${listView?.title.toLowerCase() ?? ''}`}
        allowCustom={listView?.allowCustom}
      />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} title="About your details">
        <p>We’ve filled these in from your InstingLoan profile. Check them and correct anything that has changed.</p>
        <p>Use your name exactly as it appears on your PAN — it’s matched during the (simulated) checks.</p>
      </HelpSheet>
    </ScreenLayout>
  )
}
