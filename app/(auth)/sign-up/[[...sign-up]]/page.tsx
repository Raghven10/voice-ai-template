import {SignIn, SignUp} from '@clerk/nextjs'

export default function Page() {
    return (
        <div className="flex items-center justify-center h-screen bg-amber-200 dark:bg-amber-900">
            <SignUp />
        </div>
    )
}