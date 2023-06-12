<script setup>
import Http from "@/classes/Http";
import Utils from "@/classes/Utils";
import LoadingView from "@/layouts/LoadingView.vue";
import { onMounted,ref } from "vue";
import { VDataTable } from 'vuetify/labs/VDataTable'


const isDialogOpened = ref(false)
const isLoading = ref(false)
const pageError = ref("")
const dataArray = ref([])
const dataPerPage = ref(25)
const dataToEdit = ref({})

const headers = ref([
  { title: 'Name', align: 'center', key: 'name' },
  { title: 'Router Address', align: 'center', key: 'router' },
  { title: 'Chain', align: 'center', key: 'chain' },
  { title: 'isActive', align: 'center', key: 'isActive' },
  { title: '', key: 'actions', sortable: false }
])

onMounted(() => {
  fetchData()
})

const handleOnSave = async () => {
  dataToEdit.value = {}
  fetchData()
}

const onDialogClosed = async () => {
  isDialogOpened.value = false
  dataToEdit.value = {}
}

const openDialog = () => {
  dataToEdit.value = {}
  isDialogOpened.value = true
}

const fetchData = async () => {
  try {

    pageError.value = ""
    isLoading.value = true 

    let resultStatus = await Http.getApi("/exchanges")

    //console.log(resultStatus)

    if(resultStatus.isError()){
      pageError.value = resultStatus.getMessage()
      return false;
    }

    dataArray.value = resultStatus.getData() || []
    
   // console.log(dataArray)

  } catch(e){
    console.log("exchange:", e, e.stack)
    pageError.value = Utils.systemErrorMsg
  } finally {
    isLoading.value = false
  }
}

const editItem = (item) => {
  dataToEdit.value = item
  isDialogOpened.value = true
}

const deleteItem = async (item) => {

  let loader;
  
  try {
    
    let confirmAction = await Utils.getSwal().fire({
      title: "Confirm Deletion",
      text: `Exchange "${item.name}" data will be deleted permanently, continue?`,
      showConfirmButton: true,
      showCancelButton: true
    })

    if(!confirmAction.isConfirmed) return;

    loader =  Utils.loadingModal("Deleting Item", "Deleting Exchange Data")

    let resultStatus = await Http.postApi("/exchanges/delete", { id: item._id })

    if(resultStatus.isError()){
     
      let errMsg = (resultStatus.getMessage())
                  ? resultStatus.getMessage()
                  : Utils.systemErrorMsg

      loader.close()
      return Utils.notyError(errMsg)
    }

    await fetchData()

    Utils.notySuccess("Data deleted successfully")

  }  catch(e){
      console.log("exchange#deleteItem:", e, e.stack)
      Utils.notyError(Utils.systemErrorMsg)
  } finally {
     if(loader) loader.close()
  }
}
</script>
<template>
  <div>
    <VCard class="pb-5">
      <div class="d-flex justify-space-between py-4 px-2">
        <VCardTitle>Exchanges</VCardTitle>
        <v-btn
          color="primary"
          rounded="pill"
          prepend-icon="mdi-plus"
          @click.prevent="openDialog"
        >
          New Exchange
        </v-btn>
      </div>
      <LoadingView :isLoading="isLoading">
        
        <div class="px-5 py-5" v-if="pageError != ''">
          <v-alert color="danger">
            {{ pageError }}
          </v-alert>
        </div>
        <div v-else>

          <div v-if="dataArray.length == 0" class="text-center py-5 py-5">
            No Exchanges Available
          </div>

          <div v-else>
            
            <VDataTable
              v-model:items-per-page="dataPerPage"
              :headers="headers"
              :items="dataArray"
              item-value="name"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-icon
                  size="small"
                  class="me-2"
                  @click="editItem(item.raw)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  @click="deleteItem(item.raw)"
                >
                  mdi-delete
                </v-icon>
              </template>
              
            </VDataTable>
          </div>
      </div>
      </LoadingView>
    </VCard>
  </div>
  <ExchangeDialog 
    :isOpened="isDialogOpened"
    :data="dataToEdit"
    @close="onDialogClosed"
    @save="handleOnSave"
  /> 
</template>
 