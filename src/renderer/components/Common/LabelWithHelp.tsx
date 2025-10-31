import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsInfoCircleFill } from 'react-icons/bs';

interface LabelWithHelpProps {
  text: string;
  help?: string;
}

export default function LabelWithHelp({ text, help }: LabelWithHelpProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{text}</span>
      {help && (
        <OverlayTrigger placement="right" overlay={<Tooltip id={`${text}-tip`}>{help}</Tooltip>}>
          <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help', color: '#0d6efd' }}>
            <BsInfoCircleFill size={12} />
          </span>
        </OverlayTrigger>
      )}
    </span>
  );
}


