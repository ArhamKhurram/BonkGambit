import { Button } from "../components/Button";
import { SignInButton } from "@clerk/clerk-react";

export const Landing = () => {
    return <div className="flex justify-center">
        <div className="pt-8 max-w-screen-lg">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex justify-center">
                    <img src={"/landing.png"} className="max-w-96" />
                </div>
                <div className="pt-16">
                    <div className="flex justify-center">
                        <h1 className="text-4xl font-bold text-white">Play chess online on the #2 Site!</h1>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <SignInButton>
                            <Button onClick={() => {}}>
                                Sign In with Discord
                            </Button>
                        </SignInButton>
                        <Button onClick={() => {}}>
                            Play against AI
                        </Button>
                    </div>    
                </div>
            </div>
        </div>
    </div>
}