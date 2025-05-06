import ReCAPTCHA from 'react-google-recaptcha';

export default function VisibleRecaptcha({ onChange }) {
  return (
    <div className="my-4 flex justify-center">
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={onChange}
      />
    </div>
  );
}