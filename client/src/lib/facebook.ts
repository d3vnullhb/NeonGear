declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID ?? ''
// App ID phải là chuỗi số (numeric) — nếu vẫn là placeholder thì bỏ qua
export const FB_ENABLED = /^\d+$/.test(FB_APP_ID)

let sdkReady = false
let sdkLoading = false
const callbacks: Array<() => void> = []

function loadSDK() {
  if (sdkReady || sdkLoading) return
  sdkLoading = true
  window.fbAsyncInit = () => {
    window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v19.0' })
    sdkReady = true
    callbacks.forEach((cb) => cb())
    callbacks.length = 0
  }
  const script = document.createElement('script')
  script.src = 'https://connect.facebook.net/vi_VN/sdk.js'
  script.async = true
  script.defer = true
  document.body.appendChild(script)
}

function whenReady(cb: () => void) {
  if (sdkReady) { cb(); return }
  callbacks.push(cb)
  loadSDK()
}

export function facebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    whenReady(() => {
      window.FB.login(
        (response: any) => {
          if (response.authResponse?.accessToken) {
            resolve(response.authResponse.accessToken)
          } else {
            reject(new Error('Đăng nhập Facebook bị huỷ'))
          }
        },
        { scope: 'email,public_profile' }
      )
    })
  })
}
