"use client";



import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";



export function SchoolNameSearchInput({

  value,

  onSearch,

  className = "",

  labelClassName = `shrink-0 ${FDB_TYPO.toolbarLabel}`,

  inputClassName = `box-border h-[30px] w-36 rounded-md border border-border bg-surface-2 px-2.5 py-0 leading-none outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`,

  placeholder = "학교명 입력 후 Enter",

}: {

  value: string;

  onSearch: (value: string) => void;

  className?: string;

  labelClassName?: string;

  inputClassName?: string;

  placeholder?: string;

}) {

  return (

    <label className={`flex items-center gap-2 ${className}`.trim()}>

      <span className={labelClassName}>학교명</span>

      <input

        type="search"

        key={value}

        defaultValue={value}

        placeholder={placeholder}

        className={inputClassName}

        onKeyDown={(e) => {

          if (e.key === "Enter") {

            onSearch(e.currentTarget.value.trim());

          }

        }}

      />

    </label>

  );

}

