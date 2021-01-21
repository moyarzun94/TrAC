import React, { FC, useContext } from "react";

import { Stack, StackProps, Text } from "@chakra-ui/react";

import { ICourse } from "../../../../interfaces";
import { ConfigContext } from "../../context/Config";
import { CourseBox } from "./CourseBox/CourseBox";
import { ExternalEvaluationBox } from "./CourseBox/ExternalEvaluationBox";

const toRoman = (num: number, first = false): string => {
  if (first && num === 0) {
    return "-";
  }
  if (num < 1) {
    return "";
  }
  if (num >= 40) {
    return "XL" + toRoman(num - 40);
  }
  if (num >= 10) {
    return "X" + toRoman(num - 10);
  }
  if (num >= 9) {
    return "IX" + toRoman(num - 9);
  }
  if (num >= 5) {
    return "V" + toRoman(num - 5);
  }
  if (num >= 4) {
    return "IV" + toRoman(num - 4);
  }
  if (num >= 1) {
    return "I" + toRoman(num - 1);
  }
  return "";
};

export const Semester: FC<
  {
    courses: ICourse[];
    n: number;
  } & StackProps
> = ({ courses: semester, n, mr, ...stackProps }) => {
  const { SEMESTER_HEADER_TEXT_COLOR, SEMESTER_HEADER_FONT_SIZE } = useContext(
    ConfigContext
  );

  return (
    <Stack {...stackProps} height="fit-content">
      <Text
        color={SEMESTER_HEADER_TEXT_COLOR}
        textAlign="center"
        fontSize={SEMESTER_HEADER_FONT_SIZE}
      >
        <b>{toRoman(n, true)}</b>
      </Text>
      {semester.map(
        (course) =>
          course.credits[0].value === -1 && (
            <ExternalEvaluationBox key={course.code} {...course} />
          )
      )}
      {semester.map(
        (course) =>
          course.credits[0].value !== -1 && (
            <CourseBox key={course.code} {...course} />
          )
      )}
    </Stack>
  );
};
