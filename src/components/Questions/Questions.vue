<template>
  <q-page>
    <div class="q-pt-sm" style="height: 100%">
      <div class="q-ma-md q-pa-md page-container">
        <div>
          <q-table
            class="row"
            dense
            :rows="searchResults"
            :columns="columns"
            row-key="id"
            :filter="filter"
            v-model:pagination="pagination"
            :loading="loading"
            @request="onRequest"
          >
            <template v-slot:no-data="{ icon, filter }">
              <div
                class="full-width row flex-center text-primary q-gutter-sm text-body2"
              >
                <span> Sem resultados para visualizar </span>
                <q-icon size="2em" :name="filter ? 'filter_b_and_w' : icon" />
              </div>
            </template>
            <template #body="props">
              <q-tr :props="props">
                <q-td key="code" :props="props">
                  <span
                    v-if="
                      props.row.id === null ||
                      selectedQuestion.id === props.row.id
                    "
                  >
                    <q-input
                      outlined
                      label="Código"
                      dense
                      ref="codeRef"
                      class="col"
                      v-model="data.code"
                    >
                      <template v-slot:append>
                        <q-icon
                          name="close"
                          @click="data.code = ''"
                          class="cursor-pointer"
                        />
                      </template>
                    </q-input>
                  </span>
                  <span v-else> {{ props.row.code }}</span>
                </q-td>
                <q-td key="question" :props="props">
                  <span
                    v-if="
                      props.row.id === null ||
                      selectedQuestion.id === props.row.id
                    "
                  >
                    <q-input
                      outlined
                      label="Competência"
                      dense
                      ref="questionRef"
                      class="col q-ml-md"
                      v-model="data.question"
                    >
                      <template v-slot:append>
                        <q-icon
                          name="close"
                          @click="data.question = ''"
                          class="cursor-pointer"
                        />
                      </template>
                    </q-input>
                  </span>
                  <span v-else>
                    {{ props.row.question }}
                  </span>
                </q-td>
                <q-td key="questionCategory" :props="props">
                  <span
                    v-if="
                      props.row.id === null ||
                      selectedQuestion.id === props.row.id
                    "
                  >
                    <q-select
                      class="col"
                      use-input
                      hide-selected
                      fill-input
                      input-debounce="0"
                      dense
                      outlined
                      ref="questionCategoryRef"
                      lazy-rules
                      v-model="data.questionCategory"
                      :options="questionCategories"
                      option-value="id"
                      option-label="category"
                      label="Categoria"
                    >
                      <template v-slot:no-option>
                        <q-item>
                          <q-item-section class="text-grey">
                            Sem Resultados
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                  </span>
                  <span v-else>
                    {{ props.row.questionCategory.category }}
                  </span>
                </q-td>
                <q-td key="options" :props="props">
                  <div class="col">
                    <span v-if="props.row.id === null">
                      <q-btn
                        @click="submitForm"
                        class="q-ml-md q-mb-xs float-right"
                        square
                        color="primary"
                        icon="save"
                      >
                        <q-tooltip class="bg-green-5">Salvar</q-tooltip>
                      </q-btn>
                      <q-btn
                        @click="closeForm"
                        class="q-ml-md q-mb-xs float-right"
                        square
                        color="amber"
                        icon="close"
                      >
                        <q-tooltip class="bg-amber-5">Fechar</q-tooltip>
                      </q-btn>
                    </span>
                    <span v-else>
                      <q-btn
                        v-if="selectedQuestion.id !== props.row.id"
                        flat
                        round
                        class="q-ml-md"
                        color="green-8"
                        icon="edit"
                        @click="editQuestion(props.row)"
                      >
                        <q-tooltip class="bg-green-5"
                          >Detalhar/Editar Competência</q-tooltip
                        >
                      </q-btn>
                      <q-btn
                        v-if="selectedQuestion.id === props.row.id"
                        flat
                        round
                        class="q-ml-md"
                        color="green-8"
                        icon="done"
                        @click="saveUpdate(props.row)"
                      >
                        <q-tooltip class="bg-green-5"
                          >Guardar Alteração</q-tooltip
                        >
                      </q-btn>
                      <q-btn
                        v-if="selectedQuestion.id === props.row.id"
                        flat
                        round
                        class="q-ml-md"
                        color="red-8"
                        icon="close"
                        @click="resetFields()"
                      >
                        <q-tooltip class="bg-green-5"
                          >Descartar Alteração</q-tooltip
                        >
                      </q-btn>
                      <q-btn
                        v-if="selectedQuestion.id !== props.row.id"
                        flat
                        round
                        class="q-ml-md"
                        color="red-8"
                        icon="delete"
                        @click="deleteQuestion(props.row.id)"
                      ></q-btn>
                    </span>
                  </div>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
        <div style="float: right" class="q-mt-md">
          <q-pagination
            v-model="pagination.page"
            :max="pagination.rowsNumber"
            boundary-numbers
            direction-links
            color="primary"
          />
        </div>

        <q-page-sticky position="bottom-right" :offset="[20, 30]" class="row">
          <q-fab color="primary" glossy icon="add" @click="addNewRow()" />
        </q-page-sticky>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref, inject, defineEmits, watch } from 'vue';
import questionService from 'src/services/api/question/questionService';
import User from 'src/stores/model/user/User';
import UsersService from 'src/services/api/user/UsersService';
import questionCategoryService from 'src/services/api/question/questionCategoryService';
import { computed } from 'vue';
import { useSwal } from 'src/composables/shared/dialog/dialog';
import useQuestion from 'src/composables/question/questionMethods';

const { createQuestionFromDTO } = useQuestion();

const { alertError, alertSucess, alertWarningAction } = useSwal();
const step = inject('step');
const searchResults = ref([]);
const selectedQuestion = ref('');
const openForm = ref(false);
const newRowAdded = ref(false);
const data = ref({
  code: '',
  question: '',
  questionCategory: '',
});
const columns = [
  {
    name: 'code',
    align: 'left',
    label: 'Código',
    sortable: false,
  },
  {
    name: 'question',
    align: 'left',
    label: 'Competência',
    sortable: false,
  },
  {
    name: 'questionCategory',
    align: 'left',
    label: 'Categoria',
    sortable: false,
  },
  { name: 'options', align: 'left', label: 'Opções', sortable: false },
];

const emit = defineEmits(['goToQuestioningAreas']);
const currUser = ref(new User());

const loading = ref(true);

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const onRequest = (props) => {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  loadData();
};

onMounted(() => {
  currUser.value = JSON.parse(JSON.stringify(UsersService.getLogedUser()));
  loadData();
});

const questionCategories = computed(() => {
  return questionCategoryService.piniaGetAll();
});

const submitForm = () => {
  const question = {
    code: data.value.code,
    question: data.value.question,
    questionCategory: data.value.questionCategory,
  };
  questionService.saveQuestion(question).then((res) => {
    closeForm;
    newRowAdded.value = false;
    questionService.getAll().then(() => {
      searchResults.value = questionService.piniaGetAll();
    });
  });
};

const closeForm = () => {
  data.value.code = '';
  data.value.question = '';
  data.value.questionCategory = '';
  removeRow();
};

const editQuestion = (question) => {
  removeRow();
  selectedQuestion.value = question;
  data.value = question;
};

const saveUpdate = () => {
  const question = {
    id: selectedQuestion.value.id,
    code: data.value.code,
    question: data.value.question,
    questionCategory: data.value.questionCategory,
  };

  questionService.updateQuestion(question).then((res) => {
    searchResults.value = questionService.piniaGetAll();
    resetFields();
  });
};

const resetFields = () => {
  selectedQuestion.value = {};
  data.value = { code: '', description: '' };
};

const deleteQuestion = (question) => {
  alertWarningAction('Tem certeza que deseja apagar o questiona?').then(
    (result) => {
      if (result) {
        questionService
          .deleteQuestion(question)
          .then((response) => {
            if (response.status === 200 || response.status === 201) {
              alertSucess('Question apagada com sucesso!').then((result) => {
                questionService.getAll().then((res) => {
                  searchResults.value = questionService.piniaGetAll();
                });
                // if (result) {
                //   emit('close');
                // }
              });
            } else {
              alertError('Não foi possivel apagar o questiona.');
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        console.info('OK. the Item Has not removed');
      }
    }
  );
};

const addNewRow = () => {
  resetFields();
  openForm.value = true;
  if (!newRowAdded.value) {
    newRowAdded.value = true;
    const newRow = {
      id: null,
      question: {
        code: null,
        question: null,
        questionCategory: null,
      },
      acao: 'NOVA_LINHA',
    };
    searchResults.value.unshift(newRow);
  } else {
    alertError('Há uma área sendo associado.');
  }
};

const removeRow = () => {
  if (openForm.value == true) {
    const index = searchResults.value.findIndex((item) => item.id === null);
    searchResults.value.splice(index, 1);
    newRowAdded.value = false;
  }
};

const loadData = () => {
  loading.value = true;
  search();
};

const search = async () => {
  const params = {
    page: pagination.value.page - 1,
    size: pagination.value.rowsPerPage,
  };
  Object.keys(params).forEach(
    (key) => params[key] === '' && delete params[key]
  );
  questionService
    .getAll(params)
    .then((response) => {
      searchResults.value = [];
      console.log(response);
      response.data.content.forEach((dto) => {
        searchResults.value.push(createQuestionFromDTO(dto));
      });
      pagination.value.rowsNumber = response.data.totalPages;
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
};

watch(
  () => pagination.value.page,
  (newPage) => {
    loadData();
  }
);
</script>
