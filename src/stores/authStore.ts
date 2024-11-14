import { defineStore } from 'pinia'
import { User} from '@supabase/supabase-js'
import { supabase } from '../supabase'

const getRedirectTo = () => {
    const isProd = import.meta.env.PROD
    return isProd
        ? 'https://tomogaku.space'
        : 'http://localhost:5174'
}

interface AuthState {
    user: User | null
    error: string | null
    loading: boolean
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        error: null,
        loading: false,
    }),

    actions: {
        async signInWithDiscord(): Promise<void> {
            this.loading = true
            this.error = null

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: getRedirectTo()
                }
            })

            if (error) {
                this.error = error.message
                console.error('Discord sign-in error:', error)
            }

            this.loading = false
        },

        async handleAuthRedirect(): Promise<User | null> {
            this.loading = true
            this.error = null

            try {
                // First, get the current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    console.error('Error getting session:', sessionError)
                    this.error = sessionError.message
                    this.user = null
                    return null
                }

                if (session) {
                    // If there's a session, try to refresh it
                    const { data, error: refreshError } = await supabase.auth.refreshSession()

                    if (refreshError) {
                        // If refresh fails, it might mean the session is invalid
                        console.warn('Session refresh failed:', refreshError)
                        this.error = 'Your session has expired. Please log in again.'
                        this.user = null
                        return null
                    }

                    if (data.session && data.user) {
                        this.user = data.user
                        return data.user
                    }
                }

                // If there's no session or refresh didn't return a user
                this.user = null
                return null

            } catch (error) {
                // This catch block is for unexpected errors that weren't handled above
                console.error('Unexpected error during auth check:', error)
                this.error = 'An unexpected error occurred'
                this.user = null
                return null
            } finally {
                this.loading = false
            }
        },

        async logout(): Promise<void> {
            this.loading = true
            this.error = null

            try {
                const { error } = await supabase.auth.signOut()
                if (error) {
                    console.error('Logout error:', error)
                    this.error = error.message
                } else {
                    console.log('Logout successful')
                }
            } catch (error) {
                console.error('Unexpected error during logout:', error)
                this.error = 'An unexpected error occurred during logout'
            } finally {
                // Always clear local state, even if server-side logout fails
                this.user = null
                localStorage.removeItem('supabase.auth.token')
                this.loading = false
            }
        },
    },
})