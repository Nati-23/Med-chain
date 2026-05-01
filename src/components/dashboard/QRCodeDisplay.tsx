import { QRCodeCanvas } from 'qrcode.react';

interface Props {
  value: string;
  className?: string;
}

export const QRCodeDisplay = ({ value, className }: Props) => {
  return (
    <div className={`flex justify-center items-center w-full ${className}`}>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-center">
        <QRCodeCanvas 
          value={value} 
          size={180}
          level="M"
          includeMargin={false}
        />
      </div>
    </div>
  );
};
