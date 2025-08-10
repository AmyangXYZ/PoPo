import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "./ui/button"
import Link from "next/link"
import Image from "next/image"

export default function Header() {
  return (
    <header className="justify-between items-center px-4 py-2 gap-2 z-200 absolute top-0 left-0 right-0 hidden md:flex">
      <div className="flex items-center gap-1">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 mr-6">
            <Image src="/logo.svg" alt="logo" width={32} height={32} />
            <h2 className="text-xl font-medium tracking-tight text-white">PoPo</h2>
          </div>
        </Link>

        <Link href="/gallery">
          <Button className="cursor-pointer text-white " variant="link" size="sm">
            Gallery
          </Button>
        </Link>

        <Link href="/playground">
          <Button className="cursor-pointer text-white" variant="link" size="sm">
            Playground
          </Button>
        </Link>

        <Link href="https://mikapo.vercel.app" target="_blank">
          <Button className="cursor-pointer text-white" variant="link" size="sm">
            Motion Capture
          </Button>
        </Link>

        <Link href="https://github.com/AmyangXYZ/PoPo" target="_blank">
          <Button className="cursor-pointer text-white" variant="link" size="sm">
            GitHub
          </Button>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton>
            <Button className="cursor-pointer" variant="outline" size="sm">
              Log In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button className="cursor-pointer" size="sm">
              Sign Up
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  )
}
