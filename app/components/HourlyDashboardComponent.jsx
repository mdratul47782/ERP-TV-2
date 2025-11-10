export default function HourlyDashboardComponent({
  hourlyData,
  productionData,
  registerData,
  users,
}) {
  return (
    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
      {JSON.stringify({ hourlyData, productionData, registerData, users }, null, 2)}
    </pre>
  );
}
