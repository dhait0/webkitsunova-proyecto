type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

export default AdminPageHeader;
