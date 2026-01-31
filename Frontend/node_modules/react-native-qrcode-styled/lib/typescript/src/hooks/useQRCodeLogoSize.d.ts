import type { ImageProps as SVGImageProps } from 'react-native-svg';
import type { QRCodeErrorCorrectionLevel } from '../adapters/qrcode';
type LogoSize = {
    width: number;
    height: number;
};
type UseQRCodeLogoSizeProps = {
    errorCorrectionLevel: QRCodeErrorCorrectionLevel;
    logoHref: SVGImageProps['href'];
    logoScale: number;
    pieceSize: number;
    qrCodeSize: number;
};
export default function useQRCodeLogoSize({ errorCorrectionLevel, logoHref, logoScale, pieceSize, qrCodeSize, }: UseQRCodeLogoSizeProps): LogoSize;
export {};
//# sourceMappingURL=useQRCodeLogoSize.d.ts.map