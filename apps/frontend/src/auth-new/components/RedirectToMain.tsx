import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, upsertUserProfile, getPortalUrl, USER_ROLES } from '../lib/supabase';

const RedirectToMain = () => {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function handleRedirect() {
      if (!isLoaded || !user || redirecting) return
      
      setRedirecting(true)
      
      try {
        // First, ensure user profile exists in Supabase
        let userProfile = await getUserProfile(user.id)
        
        if (!userProfile) {
          // Create new user profile
          userProfile = await upsertUserProfile(user)
          
          if (!userProfile) {
            throw new Error('Failed to create user profile')
          }
        }
        
        // Set user role for display
        setUserRole(userProfile.role)
        
        // Determine redirect URL based on user role
        const redirectUrl = getPortalUrl(userProfile.role)
        
        // Log for debugging
        console.log('🎯 Redirecting user:', {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          role: userProfile.role,
          redirectUrl
        })
        
        // Add a small delay to show the redirect message
        setTimeout(() => {
          // Use React Router navigation instead of window.location
          navigate(redirectUrl, { replace: true })
        }, 2000)
        
      } catch (error: any) {
        console.error('Redirect error:', error)
        setError(error.message || 'An error occurred')
        setRedirecting(false)
      }
    }

    handleRedirect()
  }, [user, isLoaded, redirecting, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-100 mb-2">⚠️ Authentication Error</h1>
            <p className="text-red-300">There was an issue with your authentication.</p>
          </div>
          
          <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl border border-red-800 p-6">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="inline-block bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-pink-600 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getRoleDisplay = (role) => {
    switch(role) {
      case USER_ROLES.PLATFORM_OWNER:
        return 'Platform Owner Dashboard'
      case USER_ROLES.CLIENT_ADMIN:
        return 'Admin Portal'
      case USER_ROLES.CLIENT_USER:
        return 'Client Dashboard'
      case USER_ROLES.AGENCY_OWNER:
      case USER_ROLES.AGENCY_ADMIN:
      case USER_ROLES.AGENCY_USER:
        return 'Agency Dashboard'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎉 Authentication Successful!</h1>
          <p className="text-gray-400">
            Redirecting you to {getRoleDisplay(userRole)}...
          </p>
        </div>
        
        <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-800 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-300 mb-2">
              {userRole && (
                <span className="inline-block bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Role: {userRole.replace(/_/g, ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              )}
            </p>
            <p className="text-gray-400">Please wait while we redirect you to your portal.</p>
            <p className="text-sm text-gray-500 mt-2">
              If you're not redirected automatically, 
              <button 
                onClick={() => navigate(getPortalUrl(userRole))}
                className="text-emerald-400 hover:text-emerald-300 ml-1 underline"
              >
                click here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedirectToMain;