'use client';

interface Subject {
  name: string;
  description: string;
  icon: string;
}

interface SubjectHeaderProps {
  subject: Subject;
  isStatic?: boolean;
}

export default function SubjectHeader({
  subject,
  isStatic,
}: SubjectHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">{subject.icon}</span>
        <h1 className="text-3xl font-bold text-strong">
          {subject.name}
          {isStatic && (
            <span className="ml-2 text-sm text-soft">(Static Version)</span>
          )}
        </h1>
      </div>
      <p className="text-soft">{subject.description}</p>
    </div>
  );
}
