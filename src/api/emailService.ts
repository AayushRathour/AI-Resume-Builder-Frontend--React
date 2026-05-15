/**
 * EmailJS integration for sending OTP emails from the frontend.
 *
 * Uses the EmailJS browser SDK to send emails directly without a backend email server.
 * Environment variables are now centrally managed in config/api.ts.
 */

import emailjs from '@emailjs/browser'
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from '../config/api'

const SERVICE_ID = EMAILJS_SERVICE_ID || ''
const TEMPLATE_ID = EMAILJS_TEMPLATE_ID || ''
const PUBLIC_KEY = EMAILJS_PUBLIC_KEY || ''

interface SendOtpEmailParams {
  email: string
  name: string
  otp: string
}

/**
 * Sends OTP verification email via EmailJS.
 *
 * Template variables expected by EmailJS template:
 *   {{email}} – recipient email
 *   {{name}}  – recipient name
 *   {{otp}}      – the OTP code
 */
export async function sendOtpEmail({ email, name, otp }: SendOtpEmailParams): Promise<boolean> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('[EmailJS] Missing EmailJS config. Required: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY')
    return false
  }

  if (!email || !otp) {
    console.error('[EmailJS] Email and OTP are required')
    return false
  }

  const templateParams = {
    email,
    name: name || 'User',
    otp,
  }

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    return true
  } catch (error: any) {
    console.error('[EmailJS] Failed to send OTP email:', error?.text || error?.message || error)
    return false
  }
}
