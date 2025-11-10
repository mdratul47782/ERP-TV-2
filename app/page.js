import Image from "next/image";
import SignInOut from "./components/auth/SignInOut";
import LineInfo from "./components/LineInfo";
export default function Home() {
  return (
    <>
     <SignInOut />
     <LineInfo />
    </>
  );
}
