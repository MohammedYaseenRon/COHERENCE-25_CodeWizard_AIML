"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { Filter, ChevronDown, ChevronUp, Star, Clock, Briefcase, Code, GraduationCap } from "lucide-react"
import { FilterTab } from "@/components/ui/filter-tab"
import { Checkbox } from "@/components/chexkbox"
import type { FilterOptions } from "@/types"

interface FilterSectionProps {
  isOpen: boolean
  toggleOpen: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  filterOptions: FilterOptions
  setFilterOptions: (options: FilterOptions) => void
}

export function FilterSection({
  isOpen,
  toggleOpen,
  activeTab,
  setActiveTab,
  filterOptions,
  setFilterOptions,
}: FilterSectionProps) {
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && filterRef.current) {
      gsap.fromTo(
        filterRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" },
      )
    }
  }, [isOpen])

  const toggleSkill = (skill: string) => {
    const newSkills = filterOptions.skills.includes(skill)
      ? filterOptions.skills.filter((s) => s !== skill)
      : [...filterOptions.skills, skill]

    setFilterOptions({
      ...filterOptions,
      skills: newSkills,
    })
  }

  const toggleExperience = (exp: string) => {
    const newExperience = filterOptions.experience.includes(exp)
      ? filterOptions.experience.filter((e) => e !== exp)
      : [...filterOptions.experience, exp]

    setFilterOptions({
      ...filterOptions,
      experience: newExperience,
    })
  }

  const toggleEducation = (edu: string) => {
    const newEducation = filterOptions.education.includes(edu)
      ? filterOptions.education.filter((e) => e !== edu)
      : [...filterOptions.education, edu]

    setFilterOptions({
      ...filterOptions,
      education: newEducation,
    })
  }

  const resetFilters = () => {
    setFilterOptions({
      skills: [],
      experience: [],
      education: [],
    })
  }

  return (
    <div className="bg-[#1a2235] rounded-lg mb-6 overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={toggleOpen}>
        <div className="flex items-center">
          <Filter size={18} className="mr-2" />
          <span className="font-medium">Filter Options</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div ref={filterRef} className="px-4 pb-4">
          {/* Filter tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <FilterTab
              icon={<Star size={16} />}
              label="Top Matches"
              active={activeTab === "matches"}
              onClick={() => setActiveTab("matches")}
            />
            <FilterTab
              icon={<Clock size={16} />}
              label="Recent"
              active={activeTab === "recent"}
              onClick={() => setActiveTab("recent")}
            />
            <FilterTab
              icon={<Briefcase size={16} />}
              label="Experience"
              active={activeTab === "experience"}
              onClick={() => setActiveTab("experience")}
            />
            <FilterTab
              icon={<Code size={16} />}
              label="Skills"
              active={activeTab === "skills"}
              onClick={() => setActiveTab("skills")}
            />
            <FilterTab
              icon={<GraduationCap size={16} />}
              label="Education"
              active={activeTab === "education"}
              onClick={() => setActiveTab("education")}
            />
          </div>

          {/* Filter options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-medium mb-3">Skills</h3>
              <div className="space-y-2">
                <Checkbox
                  label="React"
                  checked={filterOptions.skills.includes("React")}
                  onChange={() => toggleSkill("React")}
                />
                <Checkbox
                  label="TypeScript"
                  checked={filterOptions.skills.includes("TypeScript")}
                  onChange={() => toggleSkill("TypeScript")}
                />
                <Checkbox
                  label="Node.js"
                  checked={filterOptions.skills.includes("Node.js")}
                  onChange={() => toggleSkill("Node.js")}
                />
                <Checkbox
                  label="Python"
                  checked={filterOptions.skills.includes("Python")}
                  onChange={() => toggleSkill("Python")}
                />
                <Checkbox
                  label="Java"
                  checked={filterOptions.skills.includes("Java")}
                  onChange={() => toggleSkill("Java")}
                />
                <Checkbox
                  label="AWS"
                  checked={filterOptions.skills.includes("AWS")}
                  onChange={() => toggleSkill("AWS")}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Experience</h3>
              <div className="space-y-2">
                <Checkbox
                  label="0-2 years"
                  checked={filterOptions.experience.includes("0-2")}
                  onChange={() => toggleExperience("0-2")}
                />
                <Checkbox
                  label="3-5 years"
                  checked={filterOptions.experience.includes("3-5")}
                  onChange={() => toggleExperience("3-5")}
                />
                <Checkbox
                  label="5+ years"
                  checked={filterOptions.experience.includes("5+")}
                  onChange={() => toggleExperience("5+")}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Education</h3>
              <div className="space-y-2">
                <Checkbox
                  label="Bachelor's"
                  checked={filterOptions.education.includes("Bachelor's")}
                  onChange={() => toggleEducation("Bachelor's")}
                />
                <Checkbox
                  label="Master's"
                  checked={filterOptions.education.includes("Master's")}
                  onChange={() => toggleEducation("Master's")}
                />
                <Checkbox
                  label="PhD"
                  checked={filterOptions.education.includes("PhD")}
                  onChange={() => toggleEducation("PhD")}
                />
              </div>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex justify-end mt-6 space-x-3">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              onClick={resetFilters}
            >
              Reset
            </button>
            <button className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

