import HourlyProductionInput from "@/app/ProductionComponents/HourlyProductionInput";
import { RegisterModel } from "@/models/register-model";
import WorkingHourCard from "../ProductionComponents/WorkingHourCard";
export default function ProductionHomePage() {
  return (
    <div>
      <HourlyProductionInput />
     <WorkingHourCard
        // You can override these with real values from DB or API
        hours={[1, 2, 3, 4, 5, 6, 7, 8]}
        presentManpower={60}
        smv={1.0}
        planEfficiency={0.85}
        workingMinutesPerHour={60}
        
      />
    </div>
  );
}
