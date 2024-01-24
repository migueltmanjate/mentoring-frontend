import api from '../apiService/apiService';
import { useRepo } from 'pinia-orm';
import { UserDTO } from 'src/services/dto/user/UserDTO';
import { plainToClass } from 'class-transformer';
import Mentor from 'src/stores/model/mentor/Mentor';
import Employee from 'src/stores/model/employee/Employee';
import ProfessionalCategory from 'src/stores/model/professionalCategory/ProfessionalCategory';
import useMentor from "src/composables/mentor/mentorMethods"

const mentorRepo = useRepo(Mentor);
const { createMentorFromDTO } = useMentor();

export default {

    async search(searchParam: string) {
        return await api()
           .get(`/mentor/search?${new URLSearchParams(searchParam).toString()}`)
          .then((resp) => {
            this.generateAndSaveMentorsFromDTO(resp.data);
            return resp;
          })
          .catch((error) => {
            console.log('Error', error.message);
          });
      },
      generateAndSaveMentorsFromDTO(mentorList: any) {
        mentorList.forEach(mentorDTO => {
          const mentor = createMentorFromDTO(mentorDTO)
          mentorRepo.save(mentor);
        });

      },
      deleteAllFromStorage() {
        mentorRepo.flush();
      },
      getMentorList() {
        return mentorRepo
                      .query()
                      .withAllRecursive(2)
                      .orderBy('id', 'asc')
                      .get();
      }

};