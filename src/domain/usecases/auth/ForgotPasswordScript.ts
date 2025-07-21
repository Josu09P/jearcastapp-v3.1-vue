import { resetPassword } from '@/data/services/auth/forgot.password'

const form = document.getElementById('forgotPasswordForm') as HTMLFormElement | null
const emailInput = document.getElementById('email') as HTMLInputElement | null

if (form && emailInput) {
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault()

    const email = emailInput.value.trim()

    try {
      await resetPassword(email)
      alert('📧 Se ha enviado un enlace de recuperación a tu correo.')
    } catch (error) {
      console.error(error)
      alert('❌ Ocurrió un error. Verifica el correo e intenta nuevamente.')
    }
  })
} else {
  console.error('❌ No se encontró el formulario o el campo de correo.')
}
