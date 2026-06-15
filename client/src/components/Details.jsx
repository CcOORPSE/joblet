import React from 'react';
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from "./Accordion";
import ScoreBadge from "./ScoreBadge";

const CategoryHeader = ({ title, score }) => {
  return (
      <div className="flex items-center gap-4 py-1">
        <span className="text-lg font-bold text-slate-800">{title}</span>
        <ScoreBadge score={score} />
      </div>
  );
};

const CategoryContent = ({ tips = [] }) => {
  return (
      <div className="flex flex-col gap-4 w-full">
        {/* Tips overview Grid */}
        <div className="bg-slate-50 border border-slate-100 w-full rounded-xl px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tips.map((tip, index) => (
              <div className="flex items-center gap-2.5" key={index}>
                <img
                    src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                    alt="icon"
                    className="w-5 h-5 object-contain flex-shrink-0"
                />
                <span className="text-sm font-medium text-slate-600 truncate">{tip.tip}</span>
              </div>
          ))}
        </div>

        {/* Detailed Explanation List */}
        <div className="flex flex-col gap-3 w-full">
          {tips.map((tip, index) => (
              <div
                  key={index}
                  className={`flex flex-col gap-2 rounded-xl p-4 border ${
                      tip.type === "good"
                          ? "bg-emerald-50/30 border-emerald-100 text-emerald-900"
                          : "bg-amber-50/30 border-amber-100 text-amber-900"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                      src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                      alt="icon"
                      className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <h5 className="text-sm font-bold">{tip.tip}</h5>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 pl-7">{tip.explanation}</p>
              </div>
          ))}
        </div>
      </div>
  );
};

const Details = ({ feedback }) => {
  if (!feedback) return null;

  return (
      <div className="flex flex-col gap-4 w-full">
        <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider mb-1">Detailed Analysis</h3>
        <Accordion allowMultiple={true} defaultOpen="tone-style">
          <AccordionItem id="tone-style">
            <AccordionHeader itemId="tone-style">
              <CategoryHeader
                  title="Tone & Style"
                  score={feedback.toneAndStyle?.score || 0}
              />
            </AccordionHeader>
            <AccordionContent itemId="tone-style">
              <CategoryContent tips={feedback.toneAndStyle?.tips || []} />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem id="content">
            <AccordionHeader itemId="content">
              <CategoryHeader
                  title="Content Relevancy"
                  score={feedback.content?.score || 0}
              />
            </AccordionHeader>
            <AccordionContent itemId="content">
              <CategoryContent tips={feedback.content?.tips || []} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem id="structure">
            <AccordionHeader itemId="structure">
              <CategoryHeader
                  title="Visual Structure"
                  score={feedback.structure?.score || 0}
              />
            </AccordionHeader>
            <AccordionContent itemId="structure">
              <CategoryContent tips={feedback.structure?.tips || []} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem id="skills">
            <AccordionHeader itemId="skills">
              <CategoryHeader
                  title="Skills Optimization"
                  score={feedback.skills?.score || 0}
              />
            </AccordionHeader>
            <AccordionContent itemId="skills">
              <CategoryContent tips={feedback.skills?.tips || []} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
  );
};

export default Details;
