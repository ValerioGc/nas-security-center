const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

function ipv4(name: string) {
  const parts = name.split('.');
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

/** Whether the gateway accepts `name`, an IP address or a host name with an optional `*.` prefix. */
export function validCertificateName(name: string) {
  if (ipv4(name) || (name.includes(':') && /^[0-9a-f:.]+$/i.test(name))) {
    return true;
  }

  if (/^[\d.]+$/.test(name)) {
    return false;
  }
  
  const host = name.startsWith('*.') ? name.slice(2) : name;
  return (
    name.length <= 253 && host.length > 0 && host.split('.').every((label) => LABEL.test(label))
  );
}
