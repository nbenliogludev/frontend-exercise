import type { User } from "../types";

type UserCardProps = {
  user: User;
};

export const UserCard = ({ user }: UserCardProps) => {
  const visibleHobbies = user.hobbies.slice(0, 2);
  const hiddenHobbiesCount = Math.max(user.hobbies.length - visibleHobbies.length, 0);

  return (
    <article className="rounded-lg border border-[#d9e0e3] bg-white p-4 shadow-sm shadow-[#d7e0df]/40">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-4">
        <img
          src={user.avatar}
          alt=""
          className="h-16 w-16 rounded-md border border-[#cbd7d3] bg-[#edf4f1] object-cover"
          loading="lazy"
        />

        <div className="min-w-0">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal text-[#182026]">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-[#607077]">{user.nationality}</p>
            </div>

            <span
              className="w-fit rounded-md border border-[#d8cda8] bg-[#fff8df] px-2 py-1 text-sm font-medium tabular-nums text-[#705b16]"
              aria-label={`Age ${user.age}`}
            >
              Age {user.age}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {visibleHobbies.map((hobby) => (
              <span
                key={hobby}
                className="max-w-full truncate rounded-md border border-[#c8d8d3] bg-[#f3faf7] px-2 py-1 text-xs font-medium text-[#2d6258]"
              >
                {hobby}
              </span>
            ))}

            {hiddenHobbiesCount > 0 ? (
              <span
                className="rounded-md border border-[#d6dce0] bg-[#f6f8f9] px-2 py-1 text-xs font-medium text-[#607077]"
                title={`${hiddenHobbiesCount} more hobbies`}
              >
                +{hiddenHobbiesCount} more
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};
