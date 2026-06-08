const rows = Array.from({ length: 6 }, (_, index) => index);

export const UsersShell = () => {
  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#182026]">
      <header className="border-b border-[#d9e0e3] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-[#4f6f67]">Directory</p>
            <h1 className="text-2xl font-semibold tracking-normal text-[#182026]">Users</h1>
          </div>
          <div className="h-9 w-24 rounded border border-[#b9c8c4] bg-[#eef5f2]" />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="border border-[#d9e0e3] bg-white p-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-normal">Filters</h2>
            <div className="h-8 w-8 rounded border border-[#d9e0e3]" />
          </div>

          <div className="space-y-3">
            <div className="h-10 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
            <div className="h-10 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
            <div className="h-10 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
          </div>
        </aside>

        <section className="min-w-0 border border-[#d9e0e3] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#d9e0e3] p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold tracking-normal">Results</h2>
            <div className="flex gap-2">
              <div className="h-9 w-28 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
              <div className="h-9 w-20 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
            </div>
          </div>

          <div className="divide-y divide-[#e5eaec]">
            {rows.map((row) => (
              <div key={row} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 p-4">
                <div className="h-14 w-14 rounded border border-[#d9e0e3] bg-[#e9f0ed]" />
                <div className="min-w-0 space-y-3 py-1">
                  <div className="h-4 w-2/5 rounded bg-[#d9e0e3]" />
                  <div className="h-3 w-3/5 rounded bg-[#e5eaec]" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
                    <div className="h-6 w-24 rounded border border-[#d9e0e3] bg-[#f7f9fa]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
