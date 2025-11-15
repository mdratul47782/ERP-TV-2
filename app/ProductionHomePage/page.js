import ProductionSignInOut from "../components/auth/ProductionSignInOut";
import HourlyProductionInput from "@/app/ProductionComponents/HourlyProductionInput"
export default function ProductionHomePage(){
    return (
        <div>
            <ProductionSignInOut/>
            <HourlyProductionInput/>


        </div>


    );
}