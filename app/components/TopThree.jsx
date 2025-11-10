export default function TopThree ({ hourlyData, allHourlyData, productionData, registerData, users }) {
    console.log("Hourly Data", allHourlyData)
    return (
        <div><div className="w-full max-w-4xl mx-auto mt-6">
  {/* Title */}
  <div className="bg-red-700 text-white text-center text-sm font-bold py-1 rounded-t-md">
    TOP THREE (3) DEFECTS
  </div>

  {/* Table Layout */}
  <div className="grid grid-cols-4 text-center text-white text-xs font-semibold">
    {/* Header Row */}
    <div className="bg-red-600 border border-white py-1">RANK</div>
    <div className="bg-red-600 border border-white py-1">DEFECT NAME</div>
    <div className="bg-red-600 border border-white py-1">DEFECT QUANTITY</div>
    <div className="bg-red-600 border border-white py-1">DEFECT %</div>

    {/* Row 1 */}
    <div className="bg-red-500 border border-white py-1">Defective Rate</div>
    <div className="bg-red-500 border border-white py-1">Auto Calculate</div>
    <div className="bg-red-500 border border-white py-1">Auto Calculate</div>
    <div className="bg-red-500 border border-white py-1">Auto Calculate</div>

    {/* Row 2 */}
    <div className="bg-red-500 border border-white py-1">Defective Rate</div>
    <div className="bg-red-500 border border-white py-1">Auto Calculate</div>
    <div className="bg-red-500 border border-white py-1">Auto Calculate</div>
    <div className="bg-red-500 border border-white py-1">Auto Calculate</div>
  </div>
</div>
</div>
    );
}