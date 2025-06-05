export default function StatusMessage({ status }) {
  if (!status) return null;
  
  const bgColor = 
    status.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 
    status.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 
    'bg-blue-100 border-blue-500 text-blue-700';
  
  return (
    <div className={`p-4 mb-4 rounded border ${bgColor}`}>
      {status.message}
    </div>
  );
}
