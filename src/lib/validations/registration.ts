import { z } from 'zod';

export const playingRoles = ['batsman', 'bowler', 'all_rounder', 'wicketkeeper'] as const;
export const battingStyles = ['right_hand', 'left_hand'] as const;
export const battingPositions = ['top_order', 'middle_order', 'lower_order'] as const;
export const bowlingArms = ['right_arm', 'left_arm', 'do_not_bowl'] as const;
export const bowlingTypes = ['fast', 'medium', 'spin', 'not_applicable'] as const;
export const experienceLevels = ['beginner', '1_2_years', '3_5_years', '5_plus_years'] as const;

export const registrationSchema = z.object({
  // Step 2: Personal Details
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^(\+91[\-\s]?)?[6789]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  date_of_birth: z.string().refine((dateStr) => {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return false;
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    return age >= 12 && age <= 65;
  }, 'Player must be between 12 and 65 years old'),
  city: z.string().min(2, 'City is required').max(50),
  address: z.string().min(5, 'Full address is required').max(250),
  profile_photo_path: z.string().optional().nullable(),

  // Step 3: Cricket Profile
  playing_role: z.enum(playingRoles, { message: 'Select a valid playing role' }),
  batting_style: z.enum(battingStyles, { message: 'Select your batting style' }),
  batting_position: z.enum(battingPositions).optional().default('top_order'),
  bowling_arm: z.enum(bowlingArms, { message: 'Select your bowling arm' }),
  bowling_type: z.enum(bowlingTypes, { message: 'Select your bowling type' }),

  // Cricket Experience (Optional / Defaulted)
  experience_level: z.enum(experienceLevels).optional().default('beginner'),
  previous_team_name: z.string().max(100).optional().nullable(),
  previous_captain_name: z.string().max(100).optional().nullable(),
  previous_tournament: z.boolean().optional().default(false),
  previous_tournament_name: z.string().max(150).optional().nullable(),
  additional_information: z.string().max(500).optional().nullable(),

  // Step 5: Emergency Contact
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required').max(100),
  emergency_relationship: z.string().min(2, 'Relationship is required').max(50),
  emergency_mobile: z.string().regex(/^(\+91[\-\s]?)?[6789]\d{9}$/, 'Valid emergency contact number is required'),

  // Step 6: Payment Info
  utr_number: z.string().regex(/^\d{12}$/, 'UTR number must be exactly 12 numeric digits'),
  screenshot_path: z.string().min(1, 'Payment screenshot is required'),
  amount: z.number().int().positive().default(200),

  // Step 7: Declarations
  confirm_accuracy: z.boolean().refine(val => val === true, 'You must confirm that your details are accurate'),
  accept_rules: z.boolean().refine(val => val === true, 'You must agree to tournament rules'),
  confirm_payment: z.boolean().refine(val => val === true, 'You must confirm that the entry fee was paid via UPI')
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

