import './Spinner.css';

const Spinner = ({ size = 24, color }) => (
  <span
    className="spinner"
    style={{
      width:  size,
      height: size,
      borderColor: color
        ? `${color}30`
        : 'var(--cs-primary-light)',
      borderTopColor: color || 'var(--cs-primary)',
    }}
    role="status"
    aria-label="Loading"
  />
);

export default Spinner;